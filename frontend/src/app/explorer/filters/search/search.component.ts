import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  searchOptions,
  ComponentSearchConfigs,
  GeneralConfigs,
  ComponentDashboardConfigs,
} from 'src/app/explorer/configs/generalConfig.interface';
import { Store } from '@ngrx/store';
import * as fromStore from '../../store';
import { QuerySearchAttribute } from '../services/interfaces';
import { fromEvent } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { BodyBuilderService } from '../services/bodyBuilder/body-builder.service';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import { ComponentLookup } from '../../dashboard/components/dynamic/lookup.registry';
import { ActivatedRoute } from '@angular/router';
@ComponentLookup('SearchComponent')
@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent extends ParentComponent implements OnInit {
  @ViewChild('search') searchInput: ElementRef;
  searchTerm: string;

  constructor(
    private readonly bodyBuilderService: BodyBuilderService,
    private readonly store: Store<fromStore.AppState>,
    private activeRoute: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    const { counters, dashboard } = JSON.parse(localStorage.getItem('configs'));
    const sorcue =
      (() => {
        const [conf] = dashboard
          .flat(1)
          .filter(
            ({ componentConfigs }: GeneralConfigs) =>
              (componentConfigs as ComponentDashboardConfigs).content,
          );
        return (conf.componentConfigs as ComponentDashboardConfigs).content
          .title;
      })() || 'dc_title';
    this.subToSearchTerms();
    this.subToOrOperator();
    this.subtoToQuery(sorcue);
  }

  onClick() {
    // if (this.checkIfInputIsEmpty()) {
    //   this.checkTypeThenDelete();
    //   return;
    // }
    this.applySearchTerm();
  }

  private deleteFromMainQuery(allSearch: boolean): string {
    return this.bodyBuilderService.deleteFromMainQuery(allSearch);
  }
  prepareQueryString(string: string) {
    string = string.replace(
      new RegExp(
        '\\&|\\||\\!|\\(|\\)|\\{|\\}|\\[|\\]|\\^|\\"|\\~|\\*|\\?|\\:|\\-|\\\\|\\/|\\=|\\+|\\%|\\,|\\@',
        'gm',
      ),
      ' ',
    ); //remove special characters
    string = string.trim().replace(new RegExp('\\s{2,}', 'gm'), ' '); //remove extra whitespaces
    return string;
  }
  private applySearchTerm(): void {
    const { type } = this.componentConfigs as ComponentSearchConfigs;
    if (type === searchOptions.allSearch) {
      if (this.componentConfigs.is_advanced) {
          this.bodyBuilderService.setAggAttributes = <QuerySearchAttribute>{
            query: {
              query_string: {
                fuzziness: 'auto',
                default_operator: 'AND',
                query: this.searchTerm,
              },
            },
          };
      } else {
        this.bodyBuilderService.setAggAttributes = <QuerySearchAttribute>{
          query: {
            query_string: {
              type: 'best_fields',
              minimum_should_match: 2,
              query: this.prepareQueryString(this.searchTerm),
            },
          },
        };
      }
    } else {
      this.bodyBuilderService.setAggAttributes = this.searchTerm;
    }
    this.dispatchActions();
  }
  private subtoToQuery(source): void {
    const { type } = this.componentConfigs as ComponentSearchConfigs;
    this.store.select(fromStore.getQuery).subscribe((query) => {
      const filters = this.bodyBuilderService.getFiltersFromQuery();
      filters.forEach((element) => {
        for (const key in element)
          if (key == 'query') this.searchTerm = element[key];
          else if (key == source && type == 0) this.searchTerm = element[key];
      });
      if (!filters.filter((element) => element[source]).length)
        this.searchTerm = this.searchTerm;
      if (filters.length == 0) this.searchTerm = '';
    });
  }
  private checkTypeThenDelete() {
    let thereWasATerm: string;
    const { type } = this.componentConfigs as ComponentSearchConfigs;
    if (type === searchOptions.allSearch) {
      thereWasATerm = this.deleteFromMainQuery(true);
    } else {
      thereWasATerm = this.deleteFromMainQuery(false);
    }
    if (thereWasATerm === undefined) {
      return;
    }
    this.dispatchActions();
  }

  private dispatchActions() {
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('dashboard_name');

    this.bodyBuilderService.resetOtherComponent({ caller: 'search' });
    this.store.dispatch(

      new fromStore.SetQuery({
        dashboard: dashboard_name ? dashboard_name : 'DEFAULT_DASHBOARD',
        body: this.bodyBuilderService.buildMainQuery().build(),
      }

        ),
    );
  }

  /**
   * this method will handle if the user
   * clears the input
   */
  private subToSearchTerms() {
    if (this.searchInput)
      fromEvent(this.searchInput.nativeElement, 'input')
        .pipe(
          map((e: any) => e.target.value),
          debounceTime(250),
          map((s: string) => {
            if (this.checkIfInputIsEmpty()) {
              this.checkTypeThenDelete();
            }
          }),
        )
        .subscribe();
  }

  private checkIfInputIsEmpty(): boolean {
    return this.searchTerm === undefined || this.searchTerm.trim() === '';
  }

  private subToOrOperator(): void {
    this.bodyBuilderService.orOperator.subscribe((b: boolean) => {
      if (this.searchTerm !== undefined && this.searchTerm.length) {
        this.applySearchTerm();
      }
    });
  }
}
