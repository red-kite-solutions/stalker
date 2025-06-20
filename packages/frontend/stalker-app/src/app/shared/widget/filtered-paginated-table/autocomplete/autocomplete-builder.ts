import { Injectable, Injector, ProviderToken } from '@angular/core';
import { AutocompleteTarget } from './autocomplete';
import { StaticAutocomplete } from './static-autocomplete';

@Injectable({ providedIn: 'root' })
export class AutocompleteBuilder {
  constructor(private injector: Injector) {}

  build(target: AutocompleteTarget) {
    return new StaticAutocomplete(target, this);
  }

  inject<T>(token: ProviderToken<T>): T {
    return this.injector.get(token);
  }
}
