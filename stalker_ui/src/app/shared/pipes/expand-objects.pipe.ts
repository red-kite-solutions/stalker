import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'expandObjects',
})
export class ExpandObjectsPipe implements PipeTransform {
  /**
   * Expands the properties of all the objects in an object list (except id and _id)
   * and seperate them by a ','
   * @param values
   * @returns a comma seperated string of the values of all the properties
   */
  transform(values: any[]): string {
    const keys = Object.keys(values[0]);
    let out = '';
    for (const item of values) {
      for (const key of keys) {
        if (key === 'id' || key === '_id') continue;
        out += out === '' ? item[key] : `, ${item[key]}`;
      }
    }

    return out;
  }
}
