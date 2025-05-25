import { Autocomplete } from './autocomplete';
import { AutocompleteBuilder } from './autocomplete-builder';
import { ProjectsAutocomplete } from './projects-autocomplete';
import { TagsAutocomplete } from './tags-autocomplete';

export interface SuggestionOptions {
  icon: string;
  value: string;
  name?: string;
  children?: '_self' | ((builder: AutocompleteBuilder) => Autocomplete);
}

export const domainSuggestion: SuggestionOptions = { name: 'domain', value: 'domain:', icon: 'language' };

export const hostSuggestion: SuggestionOptions = { name: 'host', value: 'host:', icon: 'storage' };

export const portSuggestion: SuggestionOptions = { name: 'port', value: 'port:', icon: 'fingerprint' };

export const tagSuggestion: SuggestionOptions = {
  name: 'tag',
  value: 'tag:',
  icon: 'sell',
  children: (builder) => builder.inject(TagsAutocomplete),
};

export const projectSuggestion: SuggestionOptions = {
  name: 'project',
  value: 'project:',
  icon: 'folder_open',
  children: (builder) => builder.inject(ProjectsAutocomplete),
};

export const isSuggestion: SuggestionOptions = {
  name: 'is',
  value: 'is:',
  icon: 'toggle_on',
  children: (builder) => builder.build('value').suggestion({ value: 'blocked', icon: 'block' }),
};

export const findingSuggestion: SuggestionOptions = { name: 'finding', value: 'finding:', icon: 'search' };

export const excludeSuggestion: SuggestionOptions = {
  name: 'exclude',
  value: '-',
  icon: 'do_not_disturb_on',
  children: '_self',
};
