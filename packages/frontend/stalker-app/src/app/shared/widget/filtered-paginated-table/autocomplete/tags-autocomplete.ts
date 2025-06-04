import { Injectable } from '@angular/core';
import { TagsService } from '@red-kite/frontend/app/api/tags/tags.service';
import { firstValueFrom } from 'rxjs';
import { Autocomplete, AutocompleteTarget, Divider, Suggestion } from './autocomplete';

@Injectable({ providedIn: 'root' })
export class TagsAutocomplete extends Autocomplete {
  private _suggestions: (Suggestion | Divider)[] | undefined = undefined;
  protected override target: AutocompleteTarget = 'value';

  constructor(private tagService: TagsService) {
    super();
  }

  protected override async getSuggestionsCore(): Promise<(Suggestion | Divider)[]> {
    if (!this._suggestions) {
      const tags = await firstValueFrom(this.tagService.getAllTags());
      this._suggestions = tags.map((x) => ({
        type: 'suggestion',
        value: x.text,
        icon: 'sell',
        name: x.text,
      }));
    }

    return this._suggestions;
  }
}
