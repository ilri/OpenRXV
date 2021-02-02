import { Component, OnInit } from '@angular/core';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { RangeService } from '../services/range/range.service';
import {
  ElasticsearchQuery,
  QueryYearAttribute,
  BuildQueryObj,
  ResetOptions,
  ResetCaller
} from '../services/interfaces';
import { Store } from '@ngrx/store';
import * as fromStore from '../../store';
import { Observable } from 'rxjs';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import { ComponentLookup } from '../../dashboard/components/dynamic/lookup.registry';
import { BodyBuilderService } from '../services/bodyBuilder/body-builder.service';
import { query } from '@angular/animations';
@ComponentLookup('RangeComponent')
@Component({
  selector: 'app-range',
  templateUrl: './range.component.html',
  styleUrls: ['./range.component.scss'],
  providers: [RangeService]
})


export class RangeComponent extends ParentComponent implements OnInit {
  range: number[];
  max: number;
  min: number;
  config = {

  }
  loading$: Observable<boolean>;
  disabled: boolean;
  private firstMax: number;
  private firstMin: number;
  private orOperator: boolean;

  constructor(
    private readonly rangeService: RangeService,
    private readonly store: Store<fromStore.AppState>,
    private readonly bodyBuilderService: BodyBuilderService
  ) {
    super();
    this.disabled = false;
    this.rangeService.storeVal = this.store;
  }

  ngOnInit(): void {
    const { source } = this.componentConfigs as ComponentFilterConfigs;
    this.rangeService.sourceVal = source;
    this.shouldReset();
    this.loading$ = this.store.select(fromStore.getLoadingStatus);
    this.subToOrOperator();
    this.subtoToQuery(source);
  }
  slidermin
  slidermax
  onYearSliderChange(): void {
    const [min, max] = this.range;
    [this.slidermin, this.slidermax] = [min, max]
    const query: bodybuilder.Bodybuilder = this.rangeService.addAttributeToMainQuery(
      {
        gte: min,
        lte: max
      }
    );
    this.rangeService.resetNotification({ min, max });
    this.store.dispatch(new fromStore.SetQuery(query.build()));
  }
  timeout = null
  private subtoToQuery(source): void {


    this.store.select(fromStore.getQuery).subscribe((query) => {
      if (this.timeout)
        clearTimeout(this.timeout)
      let filters = this.bodyBuilderService.getFiltersFromQuery();
      filters.forEach(async (element) => {
        for (var key in element)
          if (key == source) {
            await this.getYears('select', true);
            this.range = [element[key].gte, element[key].lte];
          }
      });

      if (!filters.filter(element => element[source]).length) {
        this.getYears('select', true);
      }


    });
  }

  private subToOrOperator() {
    this.rangeService.orOperator.subscribe((b: boolean) => {
      this.orOperator = b;
      if (b) {
        this.min = this.firstMin;
        this.max = this.firstMax;
        this.disabled = false;
        this.range = [this.min, this.max];
      }
    });
  }

  private shouldReset(): void {
    const { source } = this.componentConfigs as ComponentFilterConfigs;
    /**
     * we will not get the years
     * when the user changes the range
     */
    this.rangeService.shouldReset.subscribe((ro: ResetOptions) => {
      if (ro.caller !== 'range') {
        // if the main query only have year
        // make the min and max as the first time
        if (
          Object.keys(this.rangeService.getAggAttributes).length === 1 &&
          this.rangeService.getAggAttributes[source]
        ) {
          this.disabled = false;
          this.min = this.firstMin;
          this.max = this.firstMax;
          this.range = [this.min, this.max];
          this.store.dispatch(
            new fromStore.UpdateYears(
              Array.from(
                { length: this.max + 1 - this.min },
                (_, i) => this.min + i
              )
            )
          );
        } else {
          this.getYears(ro.caller, true);
        }
      }
    });
  }

  private async getYears(caller?: ResetCaller, force: boolean = false) {
    return await new Promise((resolve, reject) => {


      const qb: BuildQueryObj = {
        size: 100000
      };
      this.rangeService
        .getYears(
          this.rangeService.buildquery(qb).build() as ElasticsearchQuery,
          force
        )
        .subscribe(
          (n: number[]) => {

            // some queries will return empty array


            resolve(n.length
              ? this.setMinMaxLogic(+n[n.length - 1], +n[0])
              : this.noYearQuery());
          }
        );
    })
  }

  private setMinMaxLogic(max: number, min: number): void {
    if (this.orOperator) {
      this.disabled = false;
      return;
    }

    if (min === max) {
      this.disabled = true;
      this.min = min - 1;
    } else {
      this.disabled = false;
      this.min = min;
    }
    this.max = max;
    this.setFirstMinMax(max, min);
    console.log(min)
    if(min != this.firstMin && max != this.firstMax)
    this.range = [this.slidermin >= min? this.slidermin : min, this.slidermax <= max? this.slidermax : max];
    else
    this.range = [min, max]

  }

  private setFirstMinMax(max: number, min: number): void {
    if (!this.range) {
      this.firstMax = max;
      this.firstMin = min;
    }
  }

  private noYearQuery(): void {
    this.disabled = true;
    this.min = 0;
    this.max = 1;
  }
}
