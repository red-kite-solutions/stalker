import { BehaviorSubject } from 'rxjs';

export interface GlobalProjectFilter {
  text: string;
  id: string;
}

const GLOBAL_PROJECT_FILTER_KEY = 'globalProjectFilter';

export function getGlobalProjectFilter(): GlobalProjectFilter | undefined {
  const rawGlobalProjectFilter = sessionStorage.getItem(GLOBAL_PROJECT_FILTER_KEY);
  if (!rawGlobalProjectFilter) return undefined;

  return JSON.parse(rawGlobalProjectFilter) as GlobalProjectFilter;
}

export function hasGlobalProjectFilter(): boolean {
  return getGlobalProjectFilter() != null;
}

export function setGlobalProjectFilter(project: GlobalProjectFilter | undefined) {
  if (project == null) {
    sessionStorage.removeItem(GLOBAL_PROJECT_FILTER_KEY);
  } else {
    sessionStorage.setItem(GLOBAL_PROJECT_FILTER_KEY, JSON.stringify(project));
  }

  globalProjectFilter$.next(getGlobalProjectFilter());
}

export const globalProjectFilter$ = new BehaviorSubject(getGlobalProjectFilter());
