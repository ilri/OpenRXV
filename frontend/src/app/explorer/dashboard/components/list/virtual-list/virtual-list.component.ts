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
  ) {
    super();
  }

  ngOnInit(): void {
    this.store
      .select<number>(fromStore.getTotal)
      .subscribe((total: number) => (this.totalItems = total));
  }
  itemClicked(value) {
    if (this.componentConfigs.allowFilterOnClick != undefined && this.componentConfigs.allowFilterOnClick != false) {
      const { source } = this.componentConfigs as ComponentFilterConfigs;
      const query: bodybuilder.Bodybuilder = this.selectService.addNewValueAttributetoMainQuery(source, value);
      this.store.dispatch(new fromStore.SetQuery(query.build()));
      this.selectService.resetNotification();
    }
  }
}
