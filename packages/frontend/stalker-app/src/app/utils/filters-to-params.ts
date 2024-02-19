import { HttpParams } from '@angular/common/http';

export function filtersToParams(filters: any) {
  let encodedFilters = new HttpParams();
  if (filters == null) return encodedFilters;

  const keys = Object.keys(filters);
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
