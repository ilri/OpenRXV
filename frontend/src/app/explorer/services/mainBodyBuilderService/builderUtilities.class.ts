import {
  SortOption,
  GeneralConfigs,
  ComponentCounterConfigs,
  ComponentDashboardConfigs,
} from 'src/app/explorer/configs/generalConfig.interface';
import { Subject, config } from 'rxjs';
import {
  QuerySearchAttribute,
  QueryYearAttribute,
  QueryFilterAttribute,
  QueryBlock,
} from 'src/app/explorer/filters/services/interfaces';

export class BuilderUtilities {
  protected dashboardConfig = [];
  protected countersConfig = [];
  protected filtersConfig = [];
  years;
  async configs() {
    const configs = await JSON.parse(localStorage.getItem('configs'));
    return configs;
  }
  private querySourceBucketsFilter: QueryBlock[];
  protected aggAttributes:
    | QueryYearAttribute
    | QuerySearchAttribute
    | QueryFilterAttribute;
  protected hitsAttributes: SortOption;
  protected orOperator: Subject<boolean>;
  protected or: boolean;
  protected titleSource: string;

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
            (componentConfigs as ComponentDashboardConfigs).content,
        );
        if (conf)
          return (conf.componentConfigs as ComponentDashboardConfigs).content
            .title;
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
      this.aggAttributes[key].forEach((s: string) =>
        this.or ? b.orFilter('term', key, s) : b.filter('term', key, s),
      );
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
    const mainQuerySources: Array<string> = Array.from(
      new Set([
        ...this.getSourcesFromConfigs(this.dashboardConfig),
        ...this.getSourcesFromConfigs(this.countersConfig),
      ]),
    );
    mainQuerySources.forEach(
      ({ filter, type, source, is_related, size, agg_on, sort }: any) => {
        arr.push({
          filter,
          type,
          size,
          is_related,
          source: `${source}.keyword`,
          agg_on: agg_on ? `${agg_on}.keyword` : undefined,
          buckets: source,
          sort: sort ? sort : false,
        });
      },
    );

    return arr;
  }

  private getSourcesFromConfigs(configs: Array<GeneralConfigs>): Array<any> {
    return [
      ...configs
        .filter(
          ({ componentConfigs }: GeneralConfigs) =>
            !Array.isArray(
              (componentConfigs as any).source ||
                (componentConfigs as any).source,
            ),
        )
        .map(({ componentConfigs }: GeneralConfigs) => {
          return {
            filter: (componentConfigs as any).filter
              ? (componentConfigs as any).filter
              : false,
            type: (componentConfigs as any).type,
            is_related: (componentConfigs as any).related
              ? (componentConfigs as any).related
              : false,
            source: (componentConfigs as any).source
              ? (componentConfigs as any).source.replace('.keyword', '')
              : undefined,
            agg_on: (componentConfigs as any).agg_on
              ? (componentConfigs as any).agg_on.replace('.keyword', '')
              : undefined,
            size: (componentConfigs as any).size
              ? parseInt((componentConfigs as any).size)
              : 10000,
            sort: componentConfigs.sort,
          };
        }),
    ];
  }

  private addCounterAttrToMainQuery(
    qb: QueryBlock,
    b: bodybuilder.Bodybuilder,
  ): void {
    const { filter, source, type } = qb; // filter comes from this.convertEnumToQueryBlock
    if (!filter && type == 'cardinality' && source != 'total.keyword') {
      b.aggregation(
        'cardinality',
        {
          field: source,
          precision_threshold: 40000,
        },
        source,
      );
    } else if (
      !filter &&
      type &&
      type != 'cardinality' &&
      source != 'total.keyword'
    ) {
      b.aggregation(
        type,
        {
          field: source.replace('.keyword', ''),
          missing: 0,
        },
        source,
      );
    } else if (filter && type && source != 'total.keyword') {
      const obj = Object.create(null);
      obj[source] = filter;
      b.aggregation(
        'filter',
        {
          term: obj,
        },
        `${source}_${filter}`,
      );
    }
  }

  private addAggregationsForCharts(b: bodybuilder.Bodybuilder): void {
    this.querySourceBucketsFilter
      .filter((d) => !d.type)
      .forEach((qb: QueryBlock) => {
        const { size, buckets, source, is_related, agg_on, type, sort } = qb;
        if (is_related === true)
          b.aggregation(
            'terms',
            this.buildTermRules(size, source, sort),
            `${size}_related_${buckets}`,
            (a) => {
              return a.aggregation(
                'terms',
                this.buildTermRules(size, agg_on ? agg_on : source, sort),
                'related',
              );
            },
          );
        else
          b.aggregation(
            'terms',
            this.buildTermRules(size, source, sort),
            `${size}_${buckets}`,
          );
      });
  }

  private buildTermRules(size: number, source: string, sort: boolean): object {
    const temp = [];
    if (this.years) {
      for (let index = this.years.gte; index <= this.years.lte; index++) {
        temp.push(`${index}`);
      }
    }
    if (source.includes('year') && temp.length != 0 && sort == true)
      return {
        field: source,
        size,
        order: {
          _key: 'desc',
        },
        include: temp,
      };
    else if (source.includes('year') && temp.length == 0 && sort == true)
      return {
        field: source,
        size,
        order: {
          _key: 'desc',
        },
      };
    else if (source.includes('year') && temp.length != 0 && sort == false)
      return {
        field: source,
        size,
        include: temp,
      };
    else
      return {
        field: source,
        size,
      };
  }
}
