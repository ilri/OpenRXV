import { Pipe, PipeTransform, NgModule } from '@angular/core';

@Pipe({
  name: 'split',
})
export class SplitPipe implements PipeTransform {
  transform(input: any, separator: string = ' ', limit?: number): any {
    if (typeof input != 'string') {
      return input;
    }

    return input.split(separator, limit);
  }
}