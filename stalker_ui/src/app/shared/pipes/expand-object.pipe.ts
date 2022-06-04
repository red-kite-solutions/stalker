import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'expandObject',
})
export class ExpandObjectPipe implements PipeTransform {
  /**
   * Expands the properties of an object (except id and _id)
   * and seperate them by a ','
   * @param value
   * @returns a comma seperated string of the values of all the properties
   */
  transform(value: any): string {
    const keys = Object.keys(value);
    let out = '';

    for (const key of keys) {
      if (key === 'id' || key === '_id') continue;
      out += out === '' ? value[key] : `, ${value[key]}`;
    }

    return out;
  }
}
