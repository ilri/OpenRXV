import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MetadataService } from 'src/app/admin/services/metadata.service';

@Component({
  selector: 'app-main-list',
  templateUrl: './main-list.component.html',
  styleUrls: ['./main-list.component.scss'],
})
export class MainListComponent implements OnInit {
  @Input() baseForm: FormGroup = null;
  content;
  tagsControls = [];
  filterOptions = [];
  metadata = [];
  tmpfilterOptions: [];
  image_tag_options = [];
  listForm: FormGroup = new FormGroup({
    title: new FormControl(''),
    description: new FormControl(''),
    identifierUri: new FormControl(''),
    identifierUriPrefix: new FormControl(''),
    altmetric: new FormControl(''),
    tags: new FormArray([]),
    filterOptions: new FormArray([]),
    thumbnail: new FormControl(''),
    thumbnail_prefix: new FormControl(''),
    square_thumbnail: new FormControl(''),
    tagOnImage: new FormControl(''),
    image_tag_options: new FormArray([]),
  });
  baseFilterOptions(element = null) {
    return {
      display: new FormControl(element ? element.display : ''),
      value: new FormControl(element ? element.value : ''),
      sort: new FormControl(element ? element.sort : ''),
      textValue: new FormControl(''),
    };
  }
  baseImageTagOptions(element = null) {
    return {
      color: new FormControl(element ? element.color : ''),
      value: new FormControl(element ? element.value : ''),
    };
  }
  baseTags(element = null) {
    return {
      metadata: new FormControl(element ? element.metadata : ''),
      disply_name: new FormControl(element ? element.disply_name : ''),
    };
  }
  constructor(private metadataService: MetadataService) {}

  async ngOnInit() {
    if (this.baseForm.get('content'))
      this.content = this.baseForm.get('content').value;
    this.metadata = await this.metadataService.get();
    if (this.content && this.content.tags)
      this.content.tags.forEach((element) => {
        this.tagsControls.push(new FormGroup(this.baseTags(element)));
      });
    if (this.content && this.content.filterOptions)
      this.content.filterOptions.forEach((element) => {
        this.filterOptions.push(new FormGroup(this.baseFilterOptions(element)));
      });
    if (this.content && this.content.image_tag_options)
      this.content.image_tag_options.forEach((element) => {
        this.image_tag_options.push(
          new FormGroup(this.baseImageTagOptions(element)),
        );
      });

    if (this.tagsControls.length) {
      this.listForm.removeControl('tags');
      this.listForm.addControl('tags', new FormArray(this.tagsControls));
    }
    if (this.filterOptions.length) {
      this.listForm.removeControl('filterOptions');
      this.listForm.addControl(
        'filterOptions',
        new FormArray(this.filterOptions),
      );
    }
    if (this.image_tag_options.length) {
      this.listForm.removeControl('image_tag_options');
      this.listForm.addControl(
        'image_tag_options',
        new FormArray(this.image_tag_options),
      );
    }
    this.listForm.patchValue(this.content);
    this.baseForm.removeControl('content');
    this.baseForm.addControl('content', this.listForm);
  }

  delete(type, index) {
    if (type == 'tags') {
      this.tagsControls.splice(index, 1);
      if (this.listForm.get('tags')) this.listForm.removeControl('tags');
      this.listForm.addControl('tags', new FormArray(this.tagsControls));
    } else if (type == 'image_tag_options') {
      this.image_tag_options.splice(index, 1);
      if (this.listForm.get('image_tag_options'))
        this.listForm.removeControl('image_tag_options');
      this.listForm.addControl(
        'image_tag_options',
        new FormArray(this.image_tag_options),
      );
    } else if (type == 'options') {
      this.filterOptions.splice(index, 1);
      if (this.listForm.get('filterOptions'))
        this.listForm.removeControl('filterOptions');
      this.listForm.addControl(
        'filterOptions',
        new FormArray(this.filterOptions),
      );
    }
    this.content = this.baseForm.get('content').value;
    this.baseForm.removeControl('content');
    this.baseForm.addControl('content', this.listForm);
  }
  AddNewdata(type) {
    if (type == 'tags') {
      this.tagsControls.push(new FormGroup(this.baseTags()));
      if (this.listForm.get('tags')) this.listForm.removeControl('tags');
      this.listForm.addControl('tags', new FormArray(this.tagsControls));
    } else if (type == 'image_tag_options') {
      this.image_tag_options.push(new FormGroup(this.baseImageTagOptions()));
      if (this.listForm.get('image_tag_options'))
        this.listForm.removeControl('image_tag_options');
      this.listForm.addControl(
        'image_tag_options',
        new FormArray(this.image_tag_options),
      );
    } else if (type == 'options') {
      this.filterOptions.push(new FormGroup(this.baseFilterOptions()));
      if (this.listForm.get('filterOptions'))
        this.listForm.removeControl('filterOptions');
      this.listForm.addControl(
        'filterOptions',
        new FormArray(this.filterOptions),
      );
    }

    this.baseForm.removeControl('content');
    this.baseForm.addControl('content', this.listForm);
  }
}
