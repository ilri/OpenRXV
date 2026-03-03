import {
  SortOption,
  GeneralConfigs,
  ComponentCounterConfigs,
  ComponentDashboardConfigs,
  SourceLevel,
} from 'src/app/explorer/configs/generalConfig.interface';
import { Subject } from 'rxjs';
import {
  QuerySearchAttribute,
  QueryYearAttribute,
  QueryFilterAttribute,
  QueryBlock,
} from 'src/app/explorer/filters/services/interfaces';
import bodybuilder from 'bodybuilder';

export class BuilderUtilities {
  protected dashboardConfig = [];
  protected countersConfig = [];
  protected filtersConfig = [];
  years;
  async configs() {
    const configs = await JSON.parse(localStorage.getItem('configs'));
    return configs;
  }
  private querySourceBucketsFilter: QueryBlock[] = [];
  protected aggAttributes:
    | QueryYearAttribute
    | QuerySearchAttribute
    | QueryFilterAttribute;
  protected hitsAttributes: SortOption;
  protected orOperator: Subject<boolean>;
  protected or: boolean;
  protected titleSource: string;
  protected defaultWithinFiltersOperator: string;

  constructor() {}

  resetAttributes() {
    this.aggAttributes = Object.create(null);
  }
  async init() {
    const { dashboard, counters, filters } = await this.configs();
    this.dashboardConfig = dashboard.flat(1);
    this.countersConfig = counters;
    this.filtersConfig = filters;

    this.querySourceBucketsFilter = this.convertEnumToQueryBlock();
    this.aggAttributes = Object.create(null);
    this.hitsAttributes = Object.create(null) as SortOption;
    this.orOperator = new Subject();
    this.or = false;
    this.titleSource =
      (() => {
        const [conf] = this.dashboardConfig.filter(
          ({ componentConfigs }: GeneralConfigs) =>
            (componentConfigs as ComponentDashboardConfigs)?.content,
        );
        if (conf)
          return (conf?.componentConfigs as ComponentDashboardConfigs)?.content
            ?.title;
        else '';
      })() || 'dc_title';
  }

  protected addCounterAgg(b: bodybuilder.Bodybuilder): void {
    this.querySourceBucketsFilter.forEach((qb: QueryBlock) =>
      this.addCounterAttrToMainQuery(qb, b),
    );
    this.addAggregationsForCharts(b);
  }

  protected addSpecificfield(key: string, b: bodybuilder.Bodybuilder): void {
    if (this.aggAttributes[key].gte && this.aggAttributes[key].lte) {
      const years = {
        gte: this.aggAttributes[key].gte,
        lte: this.aggAttributes[key].lte,
      };
      this.years = years;
      // this.or ? b.orQuery('range', key, years) : b.query('range', key, years);
      b.query('range', key, years);
    } else if (key === '_all' || key === this.titleSource) {
      this.or
        ? b.orFilter('match', { [key]: this.aggAttributes[key] })
        : b.filter('match', { [key]: this.aggAttributes[key] });
    } else if (this.aggAttributes[key].query_string) {
      if (this.aggAttributes[key].query_string.query != '')
        b.query('query_string', this.aggAttributes[key].query_string);
    } else {
      if (this.defaultWithinFiltersOperator === 'or') {
        this.or
          ? b.orFilter('terms', key, this.aggAttributes[key])
          : b.filter('terms', key, this.aggAttributes[key]);
      } else {
        this.aggAttributes[key].forEach((s: string) =>
          this.or ? b.orFilter('term', key, s) : b.filter('term', key, s),
        );
      }
    }
  }

  private extractOpenLimitedAccessFilter(): string[] {
    return this.countersConfig
      .filter((cg: GeneralConfigs) => {
        const { filter } = cg.componentConfigs as ComponentCounterConfigs;
        return !!filter;
      })
      .map((cg: GeneralConfigs) => {
        const { filter } = cg.componentConfigs as ComponentCounterConfigs;
        return filter;
      });
  }

  private convertEnumToQueryBlock(): QueryBlock[] {
    const arr: QueryBlock[] = [];
    const mainQuerySources: Array<any> = [
      ...this.getSourcesFromConfigs(this.dashboardConfig),
      ...this.getSourcesFromConfigs(this.countersConfig),
    ].filter((s) => s.source);
    mainQuerySources.forEach(
      ({
        id,
        filter,
        type,
        source,
        is_related,
        size,
        sort,
        metric,
        metric_field,
      }: any) => {
        const qb: QueryBlock = {
          filter,
          type,
          size,
          is_related,
          buckets: id,
          source: source.map((s) => ({
            ...s,
            field: s.field.includes('.keyword')
              ? s.field
              : `${s.field}.keyword`,
          })),
          sort: sort ? sort : false,
          metric,
          metric_field: metric_field ? metric_field : undefined,
        };
        arr.push(qb);
      },
    );

    return arr;
  }

  private getSourcesFromConfigs(configs: Array<GeneralConfigs>): Array<any> {
    return [
      ...configs.map(({ componentConfigs }: GeneralConfigs) => {
        return {
          id: (componentConfigs as any).id,
          filter: (componentConfigs as any).filter
            ? (componentConfigs as any).filter
            : false,
          type: (componentConfigs as any).type,
          is_related: (componentConfigs as any).related
            ? (componentConfigs as any).related
            : false,
          source: (componentConfigs as any).source,
          size: (componentConfigs as any).size
            ? parseInt((componentConfigs as any).size)
            : 10000,
          sort: componentConfigs.sort,
          metric: (componentConfigs as any).metric,
          metric_field: (componentConfigs as any).metric_field
            ? (componentConfigs as any).metric_field.replace('.keyword', '')
            : undefined,
        };
      }),
    ];
  }

  private addCounterAttrToMainQuery(
    qb: QueryBlock,
    b: bodybuilder.Bodybuilder,
  ): void {
    const { filter, source, type } = qb; // filter comes from this.convertEnumToQueryBlock
    const sourceString = source[0].field as string;
    if (!filter && type == 'cardinality' && sourceString != 'total.keyword') {
      b.aggregation(
        'cardinality',
        {
          field: sourceString,
          precision_threshold: 40000,
        },
        sourceString,
      );
    } else if (
      !filter &&
      type &&
      type != 'cardinality' &&
      sourceString != 'total.keyword'
    ) {
      b.aggregation(
        type,
        {
          field: sourceString.replace('.keyword', ''),
          missing: 0,
        },
        sourceString,
      );
    } else if (filter && type && sourceString != 'total.keyword') {
      const obj = Object.create(null);
      obj[sourceString] = filter;
      b.aggregation(
        'filter',
        {
          term: obj,
        },
        `${sourceString}_${filter}`,
      );
    }
  }

  private addAggregationsForCharts(b: bodybuilder.Bodybuilder): void {
    this.querySourceBucketsFilter
      .filter((d) => !d.type)
      .forEach((qb: QueryBlock) => {
        const { source, buckets } = qb;
        this.buildNestedAggs(b, source, 0, qb, buckets);
      });
  }

  private buildNestedAggs(
    b: bodybuilder.Bodybuilder | any,
    sources: SourceLevel[],
    index: number,
    qb: QueryBlock,
    parentName?: string,
  ): void {
    const current = sources[index];
    const isLast = index === sources.length - 1;
    const name = parentName ? parentName : `${current.field}_level_${index}`;

    b.aggregation(
      'terms',
      this.buildTermRules(
        current.limit,
        current.field,
        false,
        current.order,
        !qb?.metric || qb.metric === 'count',
      ),
      name,
      (a) => {
        if (qb.metric && qb.metric !== 'count') {
          a.aggregation(qb.metric, qb.metric_field, 'metric');
        }
        if (!isLast) {
          this.buildNestedAggs(a, sources, index + 1, qb);
        }
        return a;
      },
    );
  }

  private buildTermRules(
    size: number,
    source: string,
    sort: boolean,
    customOrder?: string,
    isCountMetric: boolean = true,
  ): object {
    const temp = [];
    if (this.years) {
      for (let index = this.years.gte; index <= this.years.lte; index++) {
        temp.push(`${index}`);
      }
    }

    const rules: any = {
      field: source,
      size,
    };

    if (customOrder === '_key_desc') {
      rules.order = { _key: 'desc' };
    } else if (customOrder === '_key_asc') {
      rules.order = { _key: 'asc' };
    } else if (customOrder === 'metric_desc') {
      rules.order = { [isCountMetric ? '_count' : 'metric']: 'desc' };
    } else if (customOrder === 'metric_asc') {
      rules.order = { [isCountMetric ? '_count' : 'metric']: 'asc' };
    } else if (source.includes('year') && sort) {
      rules.order = { _key: 'desc' };
    }

    if (source.includes('year') && temp.length !== 0) {
      rules.include = temp;
    }

    return rules;
  }
}
