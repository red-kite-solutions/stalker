import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';
import { AuthService } from '../../api/auth/auth.service';

@Directive({
  standalone: true,
  selector: '[hasScopes]',
  exportAs: 'hasScopes',
})
export class HasScopesDirective implements OnChanges {
  @Input('hasScopes') scopes: string[] | undefined;
  @Input('requiresAllScopes') requiresAllScopes: boolean = false;

  constructor(
    private el: ElementRef,
    private authService: AuthService,
    private renderer: Renderer2
  ) {}

  ngOnChanges(): void {
    let display = true;
    if (this.scopes?.length) {
      if (this.requiresAllScopes) {
        display = this.authService.userHasAllScopesOf(this.scopes);
      } else {
        display = this.authService.userHasOneScopeOf(this.scopes);
      }
    }

    if (!display) {
      this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
    }
  }
}
