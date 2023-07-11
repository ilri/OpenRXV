import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'split',
})
export class SplitPipe implements PipeTransform {
  transform(input: any, separator = ' ', limit?: number): any {
    if (typeof input != 'string') {
      return input;
    }

    return input.split(separator, limit);
  }
}
