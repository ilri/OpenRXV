import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ESSource } from 'src/app/explorer/filters/services/interfaces';
import { PaginatedListConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { environment } from 'src/environments/environment';
import { TagsComponent } from './tags/tags.component';
import { KeyValuePipe, NgClass } from '@angular/common';
@Component({
  selector: 'app-link-text',
  templateUrl: './link-text.component.html',
  styleUrls: ['./link-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TagsComponent, NgClass, KeyValuePipe],
})
export class LinkTextComponent {
  objectKeys = Object.keys;
  appearance;
  @Input() source: ESSource;
  @Input() content: PaginatedListConfigs;
  baselink = environment.api;
  constructor() {
    const { appearance } = JSON.parse(localStorage.getItem('configs'));
    this.appearance = appearance;
  }

  tags(value: string, check = false) {
    const splited = value.split('.');
    if (
      splited.length > 1 &&
      this.source?.[splited[0]] &&
      Object.hasOwn(this.source[splited[0]], splited[1]) &&
      this.source[splited[0]][splited[1]] !== '' &&
      this.source[splited[0]][splited[1]] !== null &&
      this.source[splited[0]][splited[1]] !== undefined
    ) {
      return check ? true : (this.source[splited[0]][splited[1]] as string);
    } else if (
      Object.hasOwn(this.source, splited[0]) &&
      this.source[splited[0]] !== '' &&
      this.source[splited[0]] !== null &&
      this.source[splited[0]] !== undefined
    ) {
      return check ? true : (this.source[value] as string);
    } else {
      return check ? false : '';
    }
  }

  getIcon(repo) {
    return environment.api + '/' + this.appearance.icons[repo];
  }
}
