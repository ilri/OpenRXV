import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { async } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { split } from 'ramda';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.scss']
})
export class SetupComponent implements OnInit {

  isLinear = true;
  firstFormGroup: FormGroup = new FormGroup({
    elasticsearch: new FormControl(''),
    redis: new FormControl(''),
  });
  secondFormGroup: FormGroup = new FormGroup({
    index_name: new FormControl(''),
    cron: new FormControl(''),
    startOnFirstInit: new FormControl(),
  });

  baseSchema(metadada = null, disply_name = null, disply_label = '') {
    return {
      metadata: new FormControl(metadada),
      disply_name: new FormControl(disply_name),
      disply_label: new FormControl(disply_label),
    }

  }

  repositories: FormArray = new FormArray([
    new FormGroup({
      name: new FormControl(),
      startPage: new FormControl(),
      itemsEndPoint: new FormControl(),
      allCores: new FormControl(),
      schema: new FormArray([
        new FormGroup(this.baseSchema())
      ]),
      metadata: new FormArray([
        new FormGroup(this.baseSchema())
      ])
    })
  ]);

  constructor(private settingService: SettingsService, private toastr: ToastrService) { }

  async ngOnInit() {

    let data = await this.settingService.read()
    await this.firstFormGroup.patchValue(data);
    await this.secondFormGroup.patchValue(data);
    data.repositories.forEach((element, repoindex) => {
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

  async submit() {
    if (this.firstFormGroup.valid && this.secondFormGroup.valid && this.repositories.valid) {
      let settings = { ...this.firstFormGroup.value, ...this.secondFormGroup.value, ...{ repositories: this.repositories.value } }
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
      schema.push(new FormGroup(this.baseSchema(element, (splited.join('_') as string).toLowerCase(), (splited[splited.length - 1] as string).toLowerCase().charAt(0).toUpperCase() + (splited[splited.length - 1] as string).toLowerCase().slice(1))))
    });
    data.metadata.forEach(element => {
      let splited = element.split('.');
      metadata.push(new FormGroup(this.baseSchema(element, (splited.join('_') as string).toLowerCase(), (splited[splited.length - 1] as string).toLowerCase().charAt(0).toUpperCase()+ (splited[splited.length - 1] as string).toLowerCase().slice(1))))
    });

  }

  AddNewRepo() {
    this.repositories.push(
      new FormGroup({
        name: new FormControl(),
        startPage: new FormControl(),
        itemsEndPoint: new FormControl(),
        allCores: new FormControl(),
        schema: new FormArray([
          new FormGroup(
            this.baseSchema(),
          )
        ]),
        metadata: new FormArray([
          new FormGroup(
            this.baseSchema(),
          )
        ])
      })
    )
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