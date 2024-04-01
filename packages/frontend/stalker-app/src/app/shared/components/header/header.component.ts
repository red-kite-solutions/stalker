import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/api/auth/auth.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Output()
  toggleSideBarEvent: EventEmitter<any> = new EventEmitter();

  @Input()
  public showRouting = true;

  public currentLanguageLocale = '';

  public email = '';

  public readonly languages: {
    locale: string;
    language: string;
  }[] = [
    {
      locale: 'en',
      language: 'English',
    },
    {
      locale: 'fr',
      language: 'Français',
    },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {
    this.email = this.authService.email;
    this.currentLanguageLocale = window.location.pathname.split('/')[1];
  }

  toggleSideBar() {
    this.toggleSideBarEvent.emit();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  selectLanguage(locale: string) {
    if (locale === this.currentLanguageLocale) return;

    const r = new RegExp(`^/${this.currentLanguageLocale}/`);

    window.location.pathname = window.location.pathname.replace(r, `/${locale}/`);
  }
}
