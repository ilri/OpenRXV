import { Component, ChangeDetectorRef } from '@angular/core';
import { ComponentLookup } from '../../dynamic/lookup.registry';
import { ListComponent } from '../list.component';
import { Store } from '@ngrx/store';
import { ScrollHelperService } from '../../services/scrollTo/scroll-helper.service';
import * as fromStore from '../../../../store';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import { ActivatedRoute } from '@angular/router';
import { NgxLoadingModule } from 'ngx-loading';
import { PaginatedListComponent } from '../paginated-list/paginated-list.component';
import { VirtualListComponent } from '../virtual-list/virtual-list.component';
import { IconsWithTextComponent } from '../../../representationalComponents/icons-with-text/icons-with-text.component';
import { CdkOverlayOrigin, CdkConnectedOverlay } from '@angular/cdk/overlay';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
@ComponentLookup('MainListComponent')
@Component({
    selector: 'app-main-list',
    templateUrl: '../list.component.html',
    styleUrls: ['../list.component.scss'],
    providers: [ScrollHelperService, SelectService],
    standalone: true,
    imports: [
        MatExpansionPanel,
        NgIf,
        MatIcon,
        MatTooltip,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        CdkOverlayOrigin,
        CdkConnectedOverlay,
        IconsWithTextComponent,
        VirtualListComponent,
        PaginatedListComponent,
        NgxLoadingModule,
    ],
})
export class MainListComponent extends ListComponent {
  constructor(
    public readonly store: Store<fromStore.AppState>,
    public readonly scrollHelperService: ScrollHelperService,
    public readonly cdr: ChangeDetectorRef,
    selectService: SelectService,
    bodyBuilderService: BodyBuilderService,
    activatedRoute: ActivatedRoute,
  ) {
    super(
      store,
      scrollHelperService,
      cdr,
      selectService,
      bodyBuilderService,
      activatedRoute,
    );
  }
}
