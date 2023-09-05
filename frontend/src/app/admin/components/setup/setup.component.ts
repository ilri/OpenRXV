import { Component, OnInit } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormControl,
  UntypedFormArray,
} from '@angular/forms';
import { trigger, transition, style, animate, state } from '@angular/animations';

import { SettingsService } from '../../services/settings.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss'],
  animations: [
    trigger('openClose', [
      state('true', style({
        'max-height': '*',
        opacity: 1
      })),
      state('false', style({
        'max-height': '60px',
        'overflow-y': 'hidden'
      })),
      transition('true <=> false', [
        animate('.5s')
      ]),
    ]),
  ]
})
export class SetupComponent implements OnInit {
  isLinear = true;
  types: any = [];
  isShown = {
    schema: [],
    fields: [],
  };
  index_name: string;

  baseSchema(metadada = null, disply_name = null, addOn = null) {
    return {
      metadata: new UntypedFormControl(metadada),
      disply_name: new UntypedFormControl(disply_name),
      addOn: new UntypedFormControl(addOn),
    };
  }

  selectFormat(index, value) {
    if (
      this.repositories.at(index).get('years') &&
      this.repositories.at(index).get('years').value == value
    )
      this.repositories.at(index).get('years').reset();
  }

  repositories: UntypedFormArray = new UntypedFormArray([this.getNewForm()]);

  getNewForm() {
    return new UntypedFormGroup({
      years: new UntypedFormControl(),
      name: new UntypedFormControl(),
      icon: new UntypedFormControl(),
      startPage: new UntypedFormControl(),
      type: new UntypedFormControl(),
      itemsEndPoint: new UntypedFormControl(),
      apiKey: new UntypedFormControl(),
      siteMap: new UntypedFormControl(),
      allCores: new UntypedFormControl(),
      schema: new UntypedFormArray([new UntypedFormGroup(this.baseSchema())]),
      metadata: new UntypedFormArray([new UntypedFormGroup(this.baseSchema())]),
    });
  }
  constructor(
    private settingService: SettingsService,
    private toastr: ToastrService,
    private activeRoute: ActivatedRoute,
  ) {}

  async ngOnInit() {
    this.index_name = this.activeRoute.snapshot.paramMap.get('index_name');
    this.getOutsourcePlugins();
    const data = await this.settingService.read(this.index_name);
    data.repositories.forEach((element, repoindex) => {
      if (element.icon) this.logo[repoindex] = element.icon;
      if (repoindex > 0) this.AddNewRepo();
      if (element.metadata)
        element.metadata.forEach((element, index) => {
          if (index > 0)
            this.AddNewMetadata(
              this.repositories.at(repoindex).get('metadata'),
              null
            );
        });
      if (element.schema)
        element.schema.forEach((element, index) => {
          if (index > 0)
            this.AddNewMetadata(this.repositories.at(repoindex).get('schema'), null);
        });
    });
    await this.repositories.patchValue(data.repositories);
  }
  logo = [];
  IconChange(event, index) {
    this.upload(event.target.files[0], index);
  }
  src(value) {
    return environment.api + '/' + value;
  }
  async upload(file: File, index = null) {
    this.logo[index] = await this.settingService.upload(file);
    this.repositories.at(index).get('icon').setValue(this.logo[index]);
  }
  async submit() {
    if (this.repositories.valid) {
      const settings = { repositories: this.repositories.value };
      await this.settingService.save(settings, this.index_name);
      this.toastr.success('Settings have been saved successfully');
    }
  }

  async getMetadata(index) {
    const repo = this.repositories.at(index);
    if (!repo.get('itemsEndPoint').valid) {
      this.toastr.error('REST API endpoint is not defined');
      return;
    }
    const schema = <UntypedFormArray>repo.get('schema');
    const metadata = <UntypedFormArray>repo.get('metadata');
    const data = await this.settingService.retreiveMetadata(
      repo.get('itemsEndPoint').value,
      repo.get('type').value,
    );
    schema.clear();
    metadata.clear();
    data.base.forEach((element) => {
      const splited = element.split('.');
      schema.push(
        new UntypedFormGroup(
          this.baseSchema(element, (splited.join('_') as string).toLowerCase()),
        ),
      );
    });
    if (
      repo.get('type').value == 'DSpace' ||
      repo.get('type').value == 'OpenRXV'
    )
      data.metadata.forEach((element) => {
        const splited = element.split('.');
        metadata.push(
          new UntypedFormGroup(
            this.baseSchema(
              element,
              (splited.join('_') as string).toLowerCase(),
            ),
          ),
        );
      });
    else
      data.metadata.forEach((element) => {
        metadata.push(
          new UntypedFormGroup(this.baseSchema(element, element as string)),
        );
      });
  }
  getOutsourcePlugins() {
    this.settingService.readOutSourcePlugins().then((plugins) => {
      this.types = plugins;
    });
  }
  AddNewRepo() {
    this.repositories.push(this.getNewForm());
  }
  delete(schema: UntypedFormArray, index: number) {
    schema.removeAt(index);
  }
  deleteRepo(index) {
    this.repositories.removeAt(index);
  }

  AddNewMetadata(schema: any, selector: HTMLElement) {
    schema.push(new UntypedFormGroup(this.baseSchema()));
    if (selector != null) {
      setTimeout(() => {
        selector.scrollTop = selector.scrollHeight;
      }, 200);
    }
  }

  ToggleDisplay(index) {
    if (!this.isShown.hasOwnProperty(index)) {
      this.isShown[index] = false;
    }
    this.isShown[index] = !this.isShown[index];
  }
}
