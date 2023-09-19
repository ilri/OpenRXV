import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
import { CommonService } from '../../../common.service';

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
  plugins: any = [];
  activePluginName: Array<BehaviorSubject<any>> = [];
  activePlugin: Array<any> = [];
  isShown = [];
  index_name: string;
  exportLink: string;

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
    private commonService: CommonService,
  ) {}

  async ngOnInit() {
    this.index_name = this.activeRoute.snapshot.paramMap.get('index_name');
    this.getOutsourcePlugins();
    const data = await this.settingService.read(this.index_name);
    this.refreshExportLink(data);

    if (this.repositories.length > 0) {
      this.repositories.clear();
    }

    if (data.repositories.length === 0)
      this.AddNewRepo();

    data.repositories.forEach((element, repoindex) => {
      this.populateRepository(element, repoindex);
    });
    this.repositories.patchValue(data.repositories);
  }

  populateRepository(repository, repositoryIndex){
    this.logo[repositoryIndex] = repository.icon;
    this.AddNewRepo();
    if (repository.metadata)
      repository.metadata.forEach((item, index) => {
        if (index > 0)
          this.AddNewMetadata(
              this.repositories.at(repositoryIndex).get('metadata'),
              null
          );
      });
    if (repository.schema)
      repository.schema.forEach((item, index) => {
        if (index > 0)
          this.AddNewMetadata(this.repositories.at(repositoryIndex).get('schema'), null);
      });
    if (repository.type)
      this.PluginChange(repository.type, repositoryIndex);
  }

  refreshExportLink(data) {
    const repositories = JSON.parse(JSON.stringify(data)).repositories.map((repository) => {
      if (repository?.icon !== '' && repository.icon != null) {
        repository.icon = location.origin + environment.api + '/' + repository.icon;
      }
      return repository;
    });
    this.exportLink = 'data:text/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify({repositories: repositories}));
  }

  logo = [];
  IconChange(event, index) {
    this.upload(event.target.files[0], index);
  }

  src(value) {
    try {
      return new URL(value);
    } catch (e) {
      return environment.api + '/' + value;
    }
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

      const data = await this.settingService.read(this.index_name);
      this.refreshExportLink(data);
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
      this.plugins = plugins;
    });
  }
  AddNewRepo() {
    this.repositories.push(this.getNewForm());

    const repoIndex = this.repositories.length - 1;
    this.isShown[repoIndex] = 0;
    this.activePluginName[repoIndex] = new BehaviorSubject<any>({});
    this.activePlugin[repoIndex] = {};
    this.activePluginName[repoIndex].subscribe(pluginName => {
      const activePlugin = this.plugins.filter(plugin => plugin.name === pluginName);
      if (activePlugin.length > 0) {
        this.activePlugin[repoIndex] = activePlugin[0];
      }
    });
  }
  delete(schema: UntypedFormArray, index: number) {
    schema.removeAt(index);
  }
  deleteRepo(index) {
    this.repositories.removeAt(index);
    this.isShown.splice(index, 1);
    this.activePluginName.splice(index, 1);
    this.activePlugin.splice(index, 1);
    this.logo.splice(index, 1);
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

  PluginChange(pluginName, repoindex) {
    if (this.activePluginName.hasOwnProperty(repoindex))
      this.activePluginName[repoindex].next(pluginName);
  }

  async importJSON(event) {
    const data: any = await this.commonService.importJSON(event);
    const importStatus = {
      failed: [],
      success: [],
    };
    const repositories = data.hasOwnProperty('repositories') && Array.isArray(data.repositories) ? data.repositories : [];
    for (let i = 0; i < repositories.length; i++) {
      const importedItem = (repositories[i] as any);
      const repositoryName = importedItem?.name.trim();
      if (repositoryName !== '') {
        const repository = {
          years: importedItem?.years,
          name: repositoryName,
          icon: importedItem?.icon,
          startPage: importedItem?.startPage,
          type: importedItem?.type,
          itemsEndPoint: importedItem?.itemsEndPoint,
          apiKey: importedItem?.apiKey,
          siteMap: importedItem?.siteMap,
          allCores: importedItem?.allCores,
          schema: importedItem?.schema,
          metadata: importedItem?.metadata,
        };

        const repositoryIndex = this.repositories.length;
        this.populateRepository(repository, repositoryIndex);
        importStatus.success.push(repositoryName);
        this.repositories.controls[this.repositories.length - 1].setValue(repository);
      } else {
        const message = 'Index #' + (i + 1) + ' cannot have empty name';
        importStatus.failed.push(message);
      }
    }

    const message = this.commonService.importJSONResponseMessage(importStatus, repositories.length, 'Repository(ies)');
    if (message.type === 'success') {
      this.toastr.success(message.message, null, {enableHtml: true});
    } else if (message.type === 'warning') {
      this.toastr.warning(message.message, null, {enableHtml: true});
    } else {
      this.toastr.error(message.message, null, {enableHtml: true});
    }
  }
}
