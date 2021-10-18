import { Injectable } from '@angular/core';
import * as bodybuilder from 'bodybuilder';
import { Subject } from 'rxjs';
import { MainBodyBuilderService } from 'src/app/explorer/services/mainBodyBuilderService/main-body-builder.service';
import {
  AggsRules,
  QueryYearAttribute,
  QueryFilterAttribute,
  QuerySearchAttribute,
  BuildQueryObj,
  ResetOptions,
  ResetCaller,
} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class BodyBuilderService {
  /**
   * `reset Subject` is used to till other components
   * if they should rebuild their query and get new
   * data due to the fact some other component
   * changed the query attributes !
   */
  private readonly reset: Subject<ResetOptions>;
  private from: number;

  constructor(private readonly mainBodyBuilderService: MainBodyBuilderService) {
    this.reset = new Subject();
    this.from = 0;
    this.mainBodyBuilderService.start();
  }

  get shouldReset(): Subject<ResetOptions> {
    return this.reset;
  }

  get getAggAttributes():
    | string
    | QueryYearAttribute
    | QuerySearchAttribute
    | QueryFilterAttribute {
    return this.mainBodyBuilderService.getAggAttributes;
  }
  set setAggAttributes(
    queryAttribute:
      | any
      | string
      | QueryYearAttribute
      | QuerySearchAttribute
      | QueryFilterAttribute,
  ) {
    this.mainBodyBuilderService.setAggAttributes = queryAttribute;
  }
  set setAggAttributesDirect(queryAttribute) {
    this.mainBodyBuilderService.aggAttributesDeirect = queryAttribute;
  }

  get orOperator(): Subject<boolean> {
    return this.mainBodyBuilderService.getOrOperator;
  }
  yearsBuildquery(bq: BuildQueryObj, excludeSource?: string) {
    bq.size = bq.size ? bq.size : 0;
    return this.addAggreigation(
      this.buildMainQuery(0, excludeSource).size(0), // no need for the hits
      bq,
    );
  }
  buildquery(bq: BuildQueryObj): bodybuilder.Bodybuilder {
    bq.size = bq.size ? bq.size : 10;
    return this.addQueryAttributes(
      this.addAggreigation(
        bodybuilder().size(0), // no need for the hits
        bq,
      ),
    );
  }

  buildMinMaxQuery(bq: BuildQueryObj): bodybuilder.Bodybuilder {
    bq.size = bq.size ? bq.size : 10;
    return this.addQueryAttributes(
      this.addMinMaxAggreigation(
        bodybuilder().size(0), // no need for the hits
        bq,
      ),
    );
  }

  buildMainQuery(
    from: number = 10,
    excludeSource?: string,
  ): bodybuilder.Bodybuilder {
    this.from = from === 10 ? this.from : from;
    return this.mainBodyBuilderService.buildMainQuery(
      this.from,
      undefined,
      excludeSource,
    );
  }

  deleteFromMainQuery(fromSearchAll: boolean): string {
    return this.mainBodyBuilderService.deleteFromMainQuery(fromSearchAll);
  }

  resetOtherComponent({ caller, data }: ResetOptions): void {
    this.reset.next({ caller, data });
  }

  public addAggreigation(
    query: bodybuilder.Bodybuilder,
    qb: BuildQueryObj,
  ): bodybuilder.Bodybuilder {
    const { term, size, source } = qb;
    const termRules: AggsRules = this.buildTermRules(size, source);
    // null comes when the user clear the input

    // undefined comes when no term is passed ( from the range component )
    if (term === null || term === undefined) {
      delete termRules.include;
    } else {
      this.addInclude(term, termRules);
    }
    return query.aggregation('terms', termRules, source);
  }

  public addMinMaxAggreigation(
    query: bodybuilder.Bodybuilder,
    qb: BuildQueryObj,
  ): bodybuilder.Bodybuilder {
    const { source } = qb;

    const termRules: any = {
      field: source,
    };
    query.aggregation('min', termRules, `min_${source}`);
    query.aggregation('max', termRules, `max_${source}`);
    return query;
  }

  private addInclude(term: string, termRules: AggsRules): void {
    // replace each character with "(LowerCase|UpperCase)" //regex format
    term = term
      .split('')
      .map((character) =>
        character !== ' '
          ? '(' + character.toLowerCase() + '|' + character.toUpperCase() + ')'
          : character,
      )
      .join('');
    // build a regex to match any item that has (full or partial) all the words
    termRules.include = '.*' + term.split(' ').join('.*&.*') + '.*';
  }

  private buildTermRules(size: number, source: any): AggsRules {
    return {
      field: source,
      size: size,
      shard_size: size,
      order: {
        _key: 'asc',
      },
    };
  }

  public addQueryAttributes(
    q: bodybuilder.Bodybuilder,
  ): bodybuilder.Bodybuilder {
    return this.mainBodyBuilderService.addQueryAttributes(q);
  }

  getFiltersFromQuery() {
    const query = this.buildMainQuery().build();
    let finalObj = [];
    this.traverse(query, (obj: any, key: any, val: any) => {
      if (key == 'term' && val instanceof Object) finalObj.push(val);
      if (key == 'range' && val instanceof Object) finalObj.push(val);
      if (key == 'match' && val instanceof Object) {
        finalObj.push(val);
      }
      if (key == 'query_string' && val instanceof Object) {
        finalObj.push(val);
      }
    });
    return finalObj;
  }

  async traverse(o: any, fn: (obj: any, prop: string, value: any) => void) {
    for (const i in o) {
      fn.apply(this, [o, i, o[i]]);
      if (o[i] !== null && typeof o[i] === 'object') {
        this.traverse(o[i], fn);
      }
    }
  }
}
