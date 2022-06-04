import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'whereId',
})
export class WhereIdPipe implements PipeTransform {
  transform(items: any[] | null, args: any[]): any {
    if (!items) return null;

    const res = items.find((item: any) => {
      if (item.id) {
        return item.id === args[0];
      }
      if (item._id) {
        return item._id === args[0];
      }
      return false;
    });

    return res ? res : null;
  }
}
