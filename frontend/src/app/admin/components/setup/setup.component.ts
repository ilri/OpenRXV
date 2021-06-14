import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { async } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { split } from 'ramda';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  isLinear = true;

  baseSchema(metadada = null, disply_name = null, addOn = null) {
    return {
      metadata: new FormControl(metadada),
      disply_name: new FormControl(disply_name),
      addOn: new FormControl(addOn),

    }

  }

  selectFormat(index, value) {
    if (this.repositories.at(index).get('years') && this.repositories.at(index).get('years').value == value)
      this.repositories.at(index).get('years').reset()

  }

  repositories: FormArray = new FormArray([
    this.getNewForm()
  ]);

  getNewForm() {
    return new FormGroup({
      years: new FormControl(),
      name: new FormControl(),
      icon: new FormControl(),
      startPage: new FormControl(),
      itemsEndPoint: new FormControl(),
      siteMap: new FormControl(),
      allCores: new FormControl(),
      schema: new FormArray([
        new FormGroup(this.baseSchema())
      ]),
      metadata: new FormArray([
        new FormGroup(this.baseSchema())
      ])
    })
  }
  constructor(private settingService: SettingsService, private toastr: ToastrService) { }

  async ngOnInit() {

    let data = await this.settingService.read()
    data.repositories.forEach((element, repoindex) => {
      if (element.icon)
        this.logo[repoindex] = element.icon;
      if (repoindex > 0)
        this.AddNewRepo()
      if (element.metadata)
        element.metadata.forEach((element, index) => {
          if (index > 0)
            this.AddNewMetadata(this.repositories.at(repoindex).get('metadata'))
        });
      if (element.schema)
        element.schema.forEach((element, index) => {
          if (index > 0)
            this.AddNewMetadata(this.repositories.at(repoindex).get('schema'))
        });
    });
    await this.repositories.patchValue(data.repositories)



  }
  logo = []
  IconChange(event, index) {
    this.upload(event.target.files[0], index)
  }
  src(value) {
    return environment.api + '/' + value
  }
  async upload(file: File, index = null) {
    this.logo[index] = await this.settingService.upload(file)
    this.repositories.at(index).get('icon').setValue(this.logo[index]);
  }
  async submit() {
    if (this.repositories.valid) {
      let settings = { repositories: this.repositories.value }
      await this.settingService.save(settings);
      this.toastr.success('Settings have been saved successfully');
    }
  }

  async getMetadata(index) {
    let repo = this.repositories.at(index);
    if (!repo.get('itemsEndPoint').valid) {
      this.toastr.error('REST API endpint is not defind');
      return;
    }
    let schema = <FormArray>repo.get('schema');
    let metadata = <FormArray>repo.get('metadata');
    let data = await this.settingService.retreiveMetadata(repo.get('itemsEndPoint').value);
    schema.clear();
    metadata.clear();
    data.base.forEach(element => {
      let splited = element.split('.');
      schema.push(new FormGroup(this.baseSchema(element, (splited.join('_') as string).toLowerCase())))
    });
    data.metadata.forEach(element => {
      let splited = element.split('.');
      metadata.push(new FormGroup(this.baseSchema(element, (splited.join('_') as string).toLowerCase())))
    });

  }

  AddNewRepo() {
    this.repositories.push(this.getNewForm())
  }
  delete(schema: FormArray, index: number) {
    schema.removeAt(index);
  }
  deleteRepo(index) {
    this.repositories.removeAt(index)
  }

  AddNewMetadata(schema: any) {

    schema.push(new FormGroup(this.baseSchema()))

  }

}
