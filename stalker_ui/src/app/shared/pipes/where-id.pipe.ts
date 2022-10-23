import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'whereId',
})
export class WhereIdPipe implements PipeTransform {
  transform(items: any[] | null, args: any[]): any {
    const itemId = args[0];
    if (!items || !itemId) return null;

    const res = items.find((item: any) => {
      if (item.id) {
        return item.id === itemId;
      }
      if (item._id) {
        return item._id === itemId;
      }
      return false;
    });

    return res ? res : null;
  }
}
