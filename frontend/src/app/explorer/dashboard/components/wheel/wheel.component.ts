import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { ParentChart } from '../parent-chart';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent } from '../chart/chart.component';

@Component({
  selector: 'app-wheel',
  templateUrl: './wheel.component.html',
  styleUrls: ['./wheel.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent],
})
export class WheelComponent extends ParentChart implements OnInit {
  private settingsService = inject(SettingsService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly selectService: SelectService;
  readonly store: Store<fromStore.AppState>;
  private readonly bodyBuilderService = inject(BodyBuilderService);

  colors: string[];
  enabled: boolean;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
    const cms = inject(ChartMathodsService);
    const selectService = inject(SelectService);
    const store = inject<Store<fromStore.AppState>>(Store);
    const activatedRoute = inject(ActivatedRoute);

    super(cms, selectService, store, activatedRoute);

    this.selectService = selectService;
    this.store = store;
  }
  filterd = false;
  resetFilter(value = false) {
    this.resetQ();
  }
  async ngOnInit() {
    const { source } = this.componentConfigs as ComponentFilterConfigs;
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.colors = appearance.chartColors;
    this.init('dependencywheel');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      if (buckets) {
        const filters = this.bodyBuilderService
          .getFiltersFromQuery()
          .filter(
            (element) =>
              Object.keys(element).indexOf(source + '.keyword') != -1,
          );
        if (filters.length) this.filterd = true;
        else this.filterd = false;
        this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }
  private setOptions(buckets: Array<Bucket>) {
    const data = buckets
      .map((b: Bucket) =>
        b.related.buckets
          .filter((d) => b.key != d.key)
          .map((d) => [b.key.substr(0, 50), d.key.substr(0, 50), d.doc_count]),
      )
      .flat(1);
    this.chartOptions = {
      accessibility: {
        point: {
          valueDescriptionFormat:
            '{index}. From {point.from} to {point.to}: {point.weight}.',
        },
      },
      plotOptions: {
        series: {
          point: {
            events: {
              click:
                this.componentConfigs.allowFilterOnClick == true
                  ? this.setQ()
                  : null,
            },
          },
        },
      },
      colors: this.colors,
      series: [
        {
          keys: ['from', 'to', 'weight'],
          data: data,
          type: 'dependencywheel',
          dataLabels: {
            color: '#333',
            textPath: {
              enabled: true,
              attributes: {
                dy: 5,
              },
            },
            distance: 10,
          },
          size: '95%',
        },
      ],
      ...this.cms.commonProperties(),
    };
    this.enabled = false;
    this.cdr.detectChanges();
    this.enabled = true;
  }
}
