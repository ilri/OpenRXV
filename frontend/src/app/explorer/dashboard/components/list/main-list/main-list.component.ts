import { Component, ChangeDetectorRef } from '@angular/core';
import { ComponentLookup } from '../../dynamic/lookup.registry';
import { ListComponent } from '../list.component';
import { Store } from '@ngrx/store';
import { ScrollHelperService } from '../../services/scrollTo/scroll-helper.service';
import * as fromStore from '../../../../store';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import { ActivatedRoute } from '@angular/router';
@ComponentLookup('MainListComponent')
@Component({
  selector: 'app-main-list',
  templateUrl: '../list.component.html',
  styleUrls: ['../list.component.scss'],
  providers: [ScrollHelperService, SelectService],
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
