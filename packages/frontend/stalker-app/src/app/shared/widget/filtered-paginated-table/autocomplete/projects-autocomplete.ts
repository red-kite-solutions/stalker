import { Injectable } from '@angular/core';
import { ProjectsService } from '@red-kite/frontend/app/api/projects/projects.service';
import { firstValueFrom } from 'rxjs';
import { Autocomplete, AutocompleteTarget, Divider, Suggestion } from './autocomplete';

@Injectable({ providedIn: 'root' })
export class ProjectsAutocomplete extends Autocomplete {
  private _suggestions: (Suggestion | Divider)[] | undefined = undefined;
  protected override target: AutocompleteTarget = 'value';

  constructor(private projectsService: ProjectsService) {
    super();
  }

  protected override async getSuggestionsCore(): Promise<(Suggestion | Divider)[]> {
    if (!this._suggestions) {
      const projects = await firstValueFrom(this.projectsService.getAll());
      this._suggestions = projects.map((x) => ({
        type: 'suggestion',
        value: x.name,
        icon: 'folder',
        name: x.name,
      }));
    }

    return this._suggestions;
  }
}
