import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnInit,
} from '@angular/core';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import * as fromStore from '../../../../store';
import { Store } from '@ngrx/store';
import { ScreenSizeService } from 'src/app/explorer/services/screenSize/screen-size.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-virtual-list',
  templateUrl: './virtual-list.component.html',
  styleUrls: ['./virtual-list.component.scss'],
  providers: [SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualListComponent extends ParentComponent implements OnInit {
  @Input() listData: Bucket[];
  totalItems: number;
  get isSmall(): boolean {
    return this.screenSizeService.isSmallScreen;
  }

  constructor(
    private readonly store: Store<fromStore.AppState>,
    private readonly screenSizeService: ScreenSizeService,
    public readonly selectService: SelectService,
    public activeRoute: ActivatedRoute,
  ) {
    super();
  }

  ngOnInit(): void {
    this.store
      .select<number>(fromStore.getTotal)
      .subscribe((total: number) => (this.totalItems = total));
  }
  itemClicked(value) {
    if (
      this.componentConfigs.allowFilterOnClick != undefined &&
      this.componentConfigs.allowFilterOnClick != false
    ) {
      const { source } = this.componentConfigs as ComponentFilterConfigs;
      const query: bodybuilder.Bodybuilder =
        this.selectService.addNewValueAttributetoMainQuery(source, value);
      const dashboard_name = this.activeRoute.snapshot.paramMap.get('dashboard_name');

      this.store.dispatch(
        new fromStore.SetQuery({
          dashboard: dashboard_name ? dashboard_name : 'index',
          body: query.build(),
        }),
      );
      this.selectService.resetNotification();
    }
  }
}
