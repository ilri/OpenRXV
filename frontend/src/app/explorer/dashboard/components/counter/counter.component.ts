import { Component, OnInit, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromStore from 'src/app/explorer/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ComponentCounterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { AggregationsValue } from 'src/app/explorer/filters/services/interfaces';
import { ComponentLookup } from '../dynamic/lookup.registry';
@ComponentLookup('CounterComponent')
@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss'],
})
export class CounterComponent implements OnInit {
  @Input() componentConfigs: ComponentCounterConfigs;
  private oldCount: number;
  private newCount: number;
  private storeFlag: boolean;
  private genericInterval: any;
  private getTotal: boolean;
  percentage: number;
  count: number;
  loading: boolean;
  loadingHits$: Observable<boolean>;

  constructor(private readonly store: Store<fromStore.AppState>) {
    this.oldCount = 0;
  }

  ngOnInit() {
    const { source, filter, percentageFromTotal } = this.componentConfigs;
    this.subToLoading(source, filter);
    if (percentageFromTotal) {
      this.getTotal = true;
    }
    this.loadingHits$ = this.store.select(fromStore.getLoadingOnlyHits);
  }

  private initPercantageLogic() {
    this.store
      .select(fromStore.getTotal)
      .subscribe(
        (total: number) => (this.percentage = (this.count / total) * 100),
      );
  }

  private subToLoading(source: string, filter: string): void {
    this.store.select(fromStore.getLoadingStatus).subscribe((b: boolean) => {
      this.loading = b;
      if (this.storeFlag === undefined && !b) {
        this.subToDataFromStore(source, filter);
      }
    });
  }

  private subToDataFromStore(source: string, filter: string): void {
    if (source !== 'total') {
      this.store
        .select(fromStore.getAggregation, {
          source,
          filter,
        })
        .pipe(
          map((ag: AggregationsValue) =>
            ag ? ag.value || ag.doc_count : undefined,
          ),
        )
        .subscribe((n: number) => this.initCounterLogic(n));
    } else {
      this.store
        .select(fromStore.getTotal)
        .subscribe((n: number) => this.initCounterLogic(n));
    }
    this.storeFlag = false;
  }

  private initCounterLogic(n: number): void {
    this.newCount = n;
    this.checkNotNumbers();
    this.genericIncDec();
  }

  private genericIncDec(): void {
    clearInterval(this.genericInterval);
    const { incOrDec, step, range } = this.calculateHelpers();
    let current = this.oldCount;
    this.genericInterval = setInterval(
      () => {
        current += step;
        if (current >= this.newCount && incOrDec) {
          this.changeCountOldCountAndClearInterval();
        } else if (current <= this.newCount && !incOrDec) {
          this.changeCountOldCountAndClearInterval();
        } else {
          // preventing the count from going apove the current count
          // or below the current count then increase/decrease
          this.count = current;
        }
      },
      5 ** range.toString().length / range,
    );
  }

  private calculateHelpers(): {
    incOrDec: boolean;
    step: number;
    range: number;
  } {
    const range = Math.abs(this.newCount - this.oldCount),
      whichOneIsBigger = this.newCount > this.oldCount,
      len = whichOneIsBigger
        ? this.newCount.toString().length
        : this.oldCount.toString().length,
      pow = 11 ** (len >= 2 ? len - 1 : len),
      step = whichOneIsBigger ? pow : -pow,
      incOrDec = step > 0;
    return { incOrDec, step, range };
  }

  private changeCountOldCountAndClearInterval(): void {
    clearInterval(this.genericInterval);
    this.count = this.newCount;
    this.oldCount = this.count;
    if (this.getTotal) {
      this.initPercantageLogic();
    }
  }

  private checkNotNumbers(): void {
    if (isNaN(this.newCount) || this.newCount === null) {
      this.newCount = 0;
    }
  }
}
