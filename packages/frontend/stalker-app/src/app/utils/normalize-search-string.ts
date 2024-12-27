/** Lowercases, removes diatrics and  */
export function normalizeSearchString(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
