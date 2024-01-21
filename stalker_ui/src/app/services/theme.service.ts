import { Injectable } from '@angular/core';

export type Theme = 'light' | 'dark';
export interface ThemeOption {
  theme: Theme | undefined;
  localizedName: string;
  color1: string;
  color2?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly themeLocalStorageKey = 'stalker_theme';
  public readonly themes: ThemeOption[] = [
    {
      localizedName: 'Light',
      theme: 'light',
      color1: '#ffffff',
    },
    {
      localizedName: 'Dark',
      theme: 'dark',
      color1: '#000000',
    },
    {
      localizedName: 'Browser default',
      theme: undefined,
      color1: '#ffffff',
      color2: '#000000',
    },
  ];

  public get currentTheme() {
    return this.getStoredTheme();
  }

  constructor() {
    this.updateTheme();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      // If the theme has been explicitly selected, don't obey to the browser's theme
      const storedTheme = this.getStoredTheme();
      if (storedTheme != null) return;

      this.updateTheme();
    });
  }

  public selectTheme(theme: Theme | undefined) {
    if (theme == null) {
      localStorage.removeItem(this.themeLocalStorageKey);
    } else {
      localStorage.setItem(this.themeLocalStorageKey, theme);
    }

    this.updateTheme();
  }

  private updateTheme() {
    for (const themeOption of this.themes) {
      if (themeOption.theme == null) continue;

      const themeClass = this.getThemeClassName(themeOption.theme);
      document.body.classList.remove(themeClass);
    }

    const theme = this.getStoredTheme() ?? this.getBrowserTheme();
    const themeClass = this.getThemeClassName(theme);
    document.body.classList.add(themeClass);
  }

  private getStoredTheme(): Theme | undefined {
    const storedTheme = localStorage.getItem(this.themeLocalStorageKey) as Theme;

    if (storedTheme === 'dark') return 'dark';
    if (storedTheme === 'light') return 'light';

    return undefined;
  }

  private getBrowserTheme(): Theme {
    const perferDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return perferDarkTheme ? 'dark' : 'light';
  }

  private getThemeClassName(theme: Theme): string {
    return `theme-${theme}`;
  }
}
