/** Lowercases, removes diatrics and  */
export function normalizeSearchString(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export class SearchHelper {
  public static endsWith(a: string, b: string) {
    return normalizeSearchString(a).endsWith(normalizeSearchString(b));
  }

  public static startsWith(a: string, b: string) {
    return normalizeSearchString(a).startsWith(normalizeSearchString(b));
  }

  public static includes(a: string, b: string) {
    return normalizeSearchString(a).includes(normalizeSearchString(b));
  }
}
