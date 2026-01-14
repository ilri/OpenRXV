import { Component, ChangeDetectorRef, inject } from '@angular/core';
// // import { ComponentLookup } from '../../dynamic/lookup.registry';
import { ListComponent } from '../list.component';
import { Store } from '@ngrx/store';
import { ScrollHelperService } from '../../services/scrollTo/scroll-helper.service';
import * as fromStore from '../../../../store';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import { ActivatedRoute } from '@angular/router';
import { PaginatedListComponent } from '../paginated-list/paginated-list.component';
import { VirtualListComponent } from '../virtual-list/virtual-list.component';
import { IconsWithTextComponent } from '../../../representationalComponents/icons-with-text/icons-with-text.component';
import { CdkOverlayOrigin, CdkConnectedOverlay } from '@angular/cdk/overlay';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import {NgxSpinnerComponent} from "ngx-spinner";
// // @ComponentLookup('MainListComponent')
@Component({
    selector: 'app-main-list',
    templateUrl: '../list.component.html',
    styleUrls: ['../list.component.scss'],
    providers: [ScrollHelperService, SelectService],
    imports: [
        MatExpansionPanel,
        MatIcon,
        MatTooltip,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        CdkOverlayOrigin,
        CdkConnectedOverlay,
        IconsWithTextComponent,
        VirtualListComponent,
        PaginatedListComponent,
        NgxSpinnerComponent
    ]
})
export class MainListComponent extends ListComponent {
  readonly store: Store<fromStore.AppState>;
  readonly scrollHelperService: ScrollHelperService;
  readonly cdr: ChangeDetectorRef;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const store = inject<Store<fromStore.AppState>>(Store);
    const scrollHelperService = inject(ScrollHelperService);
    const cdr = inject(ChangeDetectorRef);
    const selectService = inject(SelectService);
    const bodyBuilderService = inject(BodyBuilderService);
    const activatedRoute = inject(ActivatedRoute);

    super(
      store,
      scrollHelperService,
      cdr,
      selectService,
      bodyBuilderService,
      activatedRoute,
    );

    this.store = store;
    this.scrollHelperService = scrollHelperService;
    this.cdr = cdr;
  }
}
