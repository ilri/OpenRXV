import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * See link for more detail: https://stackoverflow.com/questions/39628007/angular2-innerhtml-binding-remove-style-attribute
 */
@Pipe({
  name: 'safeHtml',
})
export class SafeHtmlPipe implements PipeTransform {
  icons(value) {
    const regex = /[]*ICONS:\s*([^\n\ ]*)/gim;
    let matches;
    while ((matches = regex.exec(value)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (matches.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      // The result can be accessed through the `m`-variable.
      matches.forEach((match) => {
        value = value.replace(
          new RegExp(`ICONS:${match}`, 'gm'),
          `<mat-icon class="material-icons">${match}</mat-icon>`,
        );
      });
    }

    return value;
  }
  constructor(private sanitized: DomSanitizer) {}

  transform(value: string, args?: any): SafeHtml {
    if (value) {
      // value = value.replace(`ICONS:search`, `<mat-icon class="material-icons">search</mat-icon>`)
      value = this.icons(value);
      return this.sanitized.bypassSecurityTrustHtml(value);
    } else {
      return '';
    }
  }
}
