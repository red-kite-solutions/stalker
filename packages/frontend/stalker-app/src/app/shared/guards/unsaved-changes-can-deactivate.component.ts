import { Observable, of, switchMap, take } from 'rxjs';

export interface HasUnsavedChanges {
  hasUnsavedChanges$: Observable<boolean>;
}

export const hasUnsavedChangesGuard = (component: HasUnsavedChanges) =>
  component.hasUnsavedChanges$.pipe(
    take(1),
    switchMap((hasChanges) => {
      const result = hasChanges
        ? confirm(
            $localize`:Unsaved changes|The user tried to navigate but there are unsaved changes:You have unsaved changes that will be lost if you proceed. Are you sure you want to leave without saving?`
          )
        : true;

      return of(result);
    })
  );
