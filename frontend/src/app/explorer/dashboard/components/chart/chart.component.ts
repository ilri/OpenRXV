import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  HostListener,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Observable } from 'rxjs';
import * as Highcharts from 'highcharts';

// // import { ComponentLookup } from '../dynamic/lookup.registry';
import { NgxLoadingModule } from 'ngx-loading';
import { MatTooltip } from '@angular/material/tooltip';
import { HighchartsChartComponent } from 'highcharts-angular';
import { IconsWithTextComponent } from '../../representationalComponents/icons-with-text/icons-with-text.component';
import { CdkOverlayOrigin, CdkConnectedOverlay } from '@angular/cdk/overlay';
import { MatIcon } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';

// // @ComponentLookup('ChartComponent')
@Component({
    selector: 'app-chart',
    templateUrl: './chart.component.html',
    styleUrls: ['./chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        MatIcon,
        CdkOverlayOrigin,
        CdkConnectedOverlay,
        IconsWithTextComponent,
        HighchartsChartComponent,
        MatTooltip,
        NgxLoadingModule,
        AsyncPipe
    ]
})
export class ChartComponent {
  @Input() isMap = false;
  @Input() title: string;
  @Input() description: string;
  @Input() expandedStatus: boolean;
  @Input() userSeesMe: boolean;
  @Input() loading: boolean;
  @Input() loadingHits$: Observable<boolean>;
  @Input() chartOptions: Highcharts.Options;
  @Output() expanded: EventEmitter<boolean>;
  @Output() chartInstance: EventEmitter<Highcharts.Chart>;
  @ViewChild('clickToEnable') clickToEnable: ElementRef;
  @Output() resetFilter: EventEmitter<boolean>;
  @Input() filterd = false;
  popoverIsOpen = false;

  Highcharts = Highcharts;
  constructor() {
    this.expanded = new EventEmitter<boolean>();
    this.chartInstance = new EventEmitter<Highcharts.Chart>();
    this.resetFilter = new EventEmitter<boolean>();
  }
  notifyFilter(): void {
    this.resetFilter.emit(true);
  }
  notifyExpanded(b: boolean): void {
    this.expanded.emit(b);
  }

  hideClickToEnable(): void {
    this.clickToEnable.nativeElement.hidden = true;
  }

  @HostListener('mouseleave', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (this.clickToEnable) {
      // pie and worldcould do not have this
      this.clickToEnable.nativeElement.hidden = false;
    }
  }

  logChartInstance(e: Highcharts.Chart): void {
    this.chartInstance.emit(e);
  }
}
