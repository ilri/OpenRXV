import { Component, Input, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MetadataService } from 'src/app/admin/services/metadata.service';

@Component({
  selector: 'app-main-list',
  templateUrl: './main-list.component.html',
  styleUrls: ['./main-list.component.scss'],
})
export class MainListComponent implements OnInit {
  @Input() baseForm: UntypedFormGroup = null;
  @Input() dashbard_name: string = null;
  content;
  tagsControls = [];
  filterOptions = [];
  metadata = [];
  tmpfilterOptions: [];
  image_tag_options = [];
  listForm: UntypedFormGroup = new UntypedFormGroup({
    title: new UntypedFormControl(''),
    description: new UntypedFormControl(''),
    identifierUri: new UntypedFormControl(''),
    identifierUriPrefix: new UntypedFormControl(''),
    altmetric: new UntypedFormControl(''),
    tags: new UntypedFormArray([]),
    filterOptions: new UntypedFormArray([]),
    thumbnail: new UntypedFormControl(''),
    thumbnail_prefix: new UntypedFormControl(''),
    square_thumbnail: new UntypedFormControl(''),
    tagOnImage: new UntypedFormControl(''),
    image_tag_options: new UntypedFormArray([]),
  });
  baseFilterOptions(element = null) {
    return {
      display: new UntypedFormControl(element ? element.display : ''),
      value: new UntypedFormControl(element ? element.value : ''),
      sort: new UntypedFormControl(element ? element.sort : ''),
      textValue: new UntypedFormControl(''),
    };
  }
  baseImageTagOptions(element = null) {
    return {
      color: new UntypedFormControl(element ? element.color : ''),
      value: new UntypedFormControl(element ? element.value : ''),
    };
  }
  baseTags(element = null) {
    return {
      metadata: new UntypedFormControl(element ? element.metadata : ''),
      disply_name: new UntypedFormControl(element ? element.disply_name : ''),
    };
  }
  constructor(
    private metadataService: MetadataService,
    private activeRoute: ActivatedRoute,
  ) {}

  async ngOnInit() {

    if (this.baseForm.get('content'))
      this.content = this.baseForm.get('content').value;
    this.metadata = await this.metadataService.get(this.dashbard_name, null);
    if (this.content && this.content.tags)
      this.content.tags.forEach((element) => {
        this.tagsControls.push(new UntypedFormGroup(this.baseTags(element)));
      });
    if (this.content && this.content.filterOptions)
      this.content.filterOptions.forEach((element) => {
        this.filterOptions.push(
          new UntypedFormGroup(this.baseFilterOptions(element)),
        );
      });
    if (this.content && this.content.image_tag_options)
      this.content.image_tag_options.forEach((element) => {
        this.image_tag_options.push(
          new UntypedFormGroup(this.baseImageTagOptions(element)),
        );
      });

    if (this.tagsControls.length) {
      this.listForm.removeControl('tags');
      this.listForm.addControl('tags', new UntypedFormArray(this.tagsControls));
    }
    if (this.filterOptions.length) {
      this.listForm.removeControl('filterOptions');
      this.listForm.addControl(
        'filterOptions',
        new UntypedFormArray(this.filterOptions),
      );
    }
    if (this.image_tag_options.length) {
      this.listForm.removeControl('image_tag_options');
      this.listForm.addControl(
        'image_tag_options',
        new UntypedFormArray(this.image_tag_options),
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
      this.listForm.addControl('tags', new UntypedFormArray(this.tagsControls));
    } else if (type == 'image_tag_options') {
      this.image_tag_options.splice(index, 1);
      if (this.listForm.get('image_tag_options'))
        this.listForm.removeControl('image_tag_options');
      this.listForm.addControl(
        'image_tag_options',
        new UntypedFormArray(this.image_tag_options),
      );
    } else if (type == 'options') {
      this.filterOptions.splice(index, 1);
      if (this.listForm.get('filterOptions'))
        this.listForm.removeControl('filterOptions');
      this.listForm.addControl(
        'filterOptions',
        new UntypedFormArray(this.filterOptions),
      );
    }
    this.content = this.baseForm.get('content').value;
    this.baseForm.removeControl('content');
    this.baseForm.addControl('content', this.listForm);
  }
  AddNewdata(type) {
    if (type == 'tags') {
      this.tagsControls.push(new UntypedFormGroup(this.baseTags()));
      if (this.listForm.get('tags')) this.listForm.removeControl('tags');
      this.listForm.addControl('tags', new UntypedFormArray(this.tagsControls));
    } else if (type == 'image_tag_options') {
      this.image_tag_options.push(
        new UntypedFormGroup(this.baseImageTagOptions()),
      );
      if (this.listForm.get('image_tag_options'))
        this.listForm.removeControl('image_tag_options');
      this.listForm.addControl(
        'image_tag_options',
        new UntypedFormArray(this.image_tag_options),
      );
    } else if (type == 'options') {
      this.filterOptions.push(new UntypedFormGroup(this.baseFilterOptions()));
      if (this.listForm.get('filterOptions'))
        this.listForm.removeControl('filterOptions');
      this.listForm.addControl(
        'filterOptions',
        new UntypedFormArray(this.filterOptions),
      );
    }

    this.baseForm.removeControl('content');
    this.baseForm.addControl('content', this.listForm);
  }
}
