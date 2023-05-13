import { HttpParams } from '@angular/common/http';

export function filtersToParams(filters: any) {
  const keys = Object.keys(filters);
  let encodedFilters = new HttpParams();
  for (const key of keys) {
    if (Array.isArray(filters[key])) {
      for (const value of filters[key]) {
        encodedFilters = encodedFilters.append(`${key}[]`, value);
      }
    } else {
      encodedFilters = encodedFilters.set(key, filters[key]);
    }
  }
  return encodedFilters;
}
