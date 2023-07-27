import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, UntypedFormArray } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss'],
})
export class SetupComponent implements OnInit {
  isLinear = true;
  types: any = [];

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
  ) {}

  async ngOnInit() {
    this.getOutsourcePlugins();
    const data = await this.settingService.read();
    data.repositories.forEach((element, repoindex) => {
      if (element.icon) this.logo[repoindex] = element.icon;
      if (repoindex > 0) this.AddNewRepo();
      if (element.metadata)
        element.metadata.forEach((element, index) => {
          if (index > 0)
            this.AddNewMetadata(
              this.repositories.at(repoindex).get('metadata'),
            );
        });
      if (element.schema)
        element.schema.forEach((element, index) => {
          if (index > 0)
            this.AddNewMetadata(this.repositories.at(repoindex).get('schema'));
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
      await this.settingService.save(settings);
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

  AddNewMetadata(schema: any) {
    schema.push(new UntypedFormGroup(this.baseSchema()));
  }
}
