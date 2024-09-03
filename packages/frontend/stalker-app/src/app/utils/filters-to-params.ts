import { HttpParams } from '@angular/common/http';

/**
 * Create HttpParam for filters to make a GET request.
 *
 * Example filters format:
 *
 * ```json
 * { "age": 20, "name": "John", "city": ["New-York", "Toronto"] }
 * ```
 * @param filters An object to convert from `key1: value, key2: value` to `key1=value&key2=value`
 * @returns The filters as HTTP parameters
 */
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
