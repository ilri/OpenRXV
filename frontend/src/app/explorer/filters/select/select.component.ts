import { Component, OnInit } from '@angular/core';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { Subject, of, Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  tap,
  switchMap,
} from 'rxjs/operators';
import {
  ElasticsearchQuery,
  Bucket,
  QueryFilterAttribute,
  BuildQueryObj,
  ResetOptions,
} from '../services/interfaces';
import { SelectService } from '../services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../store';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import { ComponentLookup } from '../../dashboard/components/dynamic/lookup.registry';
import { BodyBuilderService } from '../services/bodyBuilder/body-builder.service';
@ComponentLookup('SelectComponent')
@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  providers: [SelectService],
})
export class SelectComponent extends ParentComponent implements OnInit {
  filterOptions: Bucket[];
  selectedOptions: Bucket[];
  searchTerms$: Subject<string>;
  private size: number;
  private doNotChange: boolean;
  private orQuery: Partial<ElasticsearchQuery>;
  private isTheOrOperatorSelected: boolean;
  private typedTerm: string;
  private opened: boolean;

  constructor(
    private readonly selectService: SelectService,
    private readonly store: Store<fromStore.AppState>,
    private readonly bodyBuilderService: BodyBuilderService,
  ) {
    super();
    this.filterOptions = [];
    this.searchTerms$ = new Subject();
    this.size = 10;
    this.doNotChange = false;
    this.selectedOptions = [];
    this.opened = false;
  }
  private subtoToQuery(source): void {
    this.store.select(fromStore.getQuery).subscribe((query) => {
      const filters = this.bodyBuilderService.getFiltersFromQuery();

      filters.forEach((element) => {
        for (var key in element)
          if (key == source) {
            this.selectedOptions = [
              ...this.selectedOptions.filter((d) => d.key != element[key]),
              ...[{ key: element[key], doc_count: 1 }],
            ];
          }
      });

      if (!filters.filter((element) => element[source]).length) {
        this.selectedOptions = [];
        this.doNotChange = false;
      }
    });
  }
  ngOnInit(): void {
    const { source } = this.componentConfigs as ComponentFilterConfigs;
    this.selectService.sourceVal = source;
    this.subToOrOperator();
    this.subtoDataStream();
    this.subtoTermStream();
    this.shouldReset();
    this.subtoToQuery(source);
  }

  getDataOnOpen(): void {
    this.opened = true;
    this.getDataAndToggle();
  }

  onScrollToEnd(): void {
    this.size += 10;
    this.getData(this.buildQuery());
  }

  /**
   * ***when the user types a word and he/she DO NOT select
   * an option the typedTerm need to be null
   * so it won't affect the query of this component
   * and the component need to get the data one more time
   * so the previous words the user typed won't affect the query***
   */
  onBlur(e: FocusEvent): void {
    if (this.typedTerm || this.typedTerm === '') {
      this.typedTerm = null;
      this.doNotChange = false;
      this.getDataAndToggle();
    }
  }

  /**
   * ***when the user types a word and select
   * an option the typedTerm need to be null
   * so it won't affect the query of this component***
   */
  onAdd(e: Bucket): void {
    this.typedTerm = null;
  }

  onChange(selectedOptions: Bucket[]): void {
    const { source } = this.componentConfigs as ComponentFilterConfigs;
    const query: bodybuilder.Bodybuilder =
      this.selectService.addAttributeToMainQuery({
        [source]: selectedOptions.map((b: Bucket) => b.key),
      } as QueryFilterAttribute);
    this.store.dispatch(new fromStore.SetQuery(query.build()));
    this.selectService.resetNotification();
  }

  onRemove(option: Bucket): void {
    this.getDataAndToggle();
  }

  private getDataAndToggle(): void {
    if (this.doNotChange) {
      return;
    }
    this.doNotChange = true;
    this.getData(this.buildQuery());
  }

  private subtoTermStream(): void {
    this.termStream().subscribe((term: string) => {
      if (term === '') {
        this.size = 10;
      }
      this.typedTerm = term;
      this.getData(this.buildQuery());
    });
  }

  private termStream(): Observable<string> {
    return this.searchTerms$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => (this.loading = true)),
      switchMap((term) => of(term)),
    );
  }

  private subtoDataStream(): void {
    this.selectService.subjetData.subscribe((b: Bucket[]) => {
      this.loading = false;
      this.filterOptions = b;
    });
  }

  private buildQuery(): any {
    const bq: BuildQueryObj = {
      size: this.size,
      term: this.typedTerm ? this.typedTerm : null,
    };
    return this.selectService.buildquery(bq).build();
  }

  private getData(queryBody: ElasticsearchQuery): void {
    const { query, ...orQuery } = queryBody;
    this.orQuery = orQuery;
    this.loading = true;
    this.selectService.paginateData(
      this.isTheOrOperatorSelected ? this.orQuery : queryBody,
    );
  }

  private shouldReset(): void {
    this.selectService.shouldReset.subscribe((ro: ResetOptions) => {
      this.reset();
      this.toggleIfDirty();
    });
  }

  private subToOrOperator(): void {
    this.selectService.orOperator.subscribe((b: boolean) => {
      this.isTheOrOperatorSelected = b;
      this.reset();
      this.toggleIfDirty();
      if (this.selectedOptions.length) {
        this.onChange(this.selectedOptions);
      }
    });
  }

  private reset(): void {
    this.doNotChange = false;
    this.filterOptions = [];
  }

  private toggleIfDirty(): void {
    if (this.opened) {
      this.getDataAndToggle();
    }
  }
}
