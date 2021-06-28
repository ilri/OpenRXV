import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MetadataService } from 'src/app/admin/services/metadata.service';

@Component({
  selector: 'app-main-list',
  templateUrl: './main-list.component.html',
  styleUrls: ['./main-list.component.scss']
})
export class MainListComponent implements OnInit {
  @Input() baseForm: FormGroup = null;
  content
  tagsControls = [];
  filterOptions = [];
  metadata = [];
  tmpfilterOptions: []
  listForm: FormGroup = new FormGroup({
    title: new FormControl(''),
    description: new FormControl(''),
    identifierUri: new FormControl(''),
    altmetric: new FormControl(''),
    tags: new FormArray([], [
      Validators.required
    ]),
    filterOptions: new FormArray([]),

  });
  baseFilterOptions(element = null) {
    return {
      display: new FormControl(element ? element.display : ''),
      value: new FormControl(element ? element.value : ''),
      sort: new FormControl(element ? element.sort : ''),
      textValue: new FormControl('')
    }
  }
  baseTags(element = null) {
    return {
      metadata: new FormControl(element ? element.metadata : ''),
      disply_name: new FormControl(element ? element.disply_name : ''),
    }
  }
  constructor(private metadataService: MetadataService) { }

  async ngOnInit() {
    if (this.baseForm.get('content'))
      this.content = this.baseForm.get('content').value
    this.metadata = await this.metadataService.get()
    if (this.content && this.content.tags)
      this.content.tags.forEach(element => {
        this.tagsControls.push(new FormGroup(this.baseTags(element)))
      });
    else
      this.AddNewdata([], 'tags')
    if (this.content && this.content.filterOptions)
      this.content.filterOptions.forEach(element => {
        this.filterOptions.push(new FormGroup(this.baseFilterOptions(element)))
      });

    if (this.tagsControls.length) {
      this.listForm.removeControl('tags');
      this.listForm.addControl('tags', new FormArray(this.tagsControls))
    }
    if (this.filterOptions.length) {
      this.listForm.removeControl('filterOptions');
      this.listForm.addControl('filterOptions', new FormArray(this.filterOptions))
    }
    if (this.content)
      this.listForm.patchValue(this.content);
    this.baseForm.removeControl('content')
    this.baseForm.addControl('content', this.listForm);
  }

  delete(type, index) {
    if (type == 'tags') {
      this.tagsControls.splice(index, 1)
      if (this.listForm.get('tags'))
        this.listForm.removeControl('tags');
      this.listForm.addControl('tags', new FormArray(this.tagsControls))
    } else {
      this.filterOptions.splice(index, 1)
      if (this.listForm.get('filterOptions'))
        this.listForm.removeControl('filterOptions');
      this.listForm.addControl('filterOptions', new FormArray(this.filterOptions))
    }

    this.baseForm.removeControl('content')
    this.baseForm.addControl('content', this.listForm);

  }
  AddNewdata(array, type) {
    if (type == 'tags') {
      this.tagsControls.push(new FormGroup(this.baseTags()))
      if (this.listForm.get('tags'))
        this.listForm.removeControl('tags');
      this.listForm.addControl('tags', new FormArray(this.tagsControls))
    } else {
      this.filterOptions.push(new FormGroup(this.baseFilterOptions()))
      if (this.listForm.get('filterOptions'))
        this.listForm.removeControl('filterOptions');
      this.listForm.addControl('filterOptions', new FormArray(this.filterOptions))
    }

    this.baseForm.removeControl('content')
    this.baseForm.addControl('content', this.listForm);

  }
}
