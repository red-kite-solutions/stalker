import { Component, Directive, HostBinding } from '@angular/core';

@Component({
  selector: 'panel-section-title',
  template: `<ng-content></ng-content>`,
  styleUrls: ['./panel-section-title.component.scss'],
})
export class PanelSectionTitleComponent {}

@Component({
  selector: 'panel-section-subtitle',
  template: `<ng-content></ng-content>`,
  styleUrls: ['./panel-section-subtitle.component.scss'],
})
export class PanelSectionSubtitleComponent {}

@Directive({ selector: 'panel-section a' })
export class PanelSectionLinkDirective {
  @HostBinding('class') elementClass = 'panel-section-link';
}

@Directive({ selector: 'panel-section button[panel-load-more]' })
export class PanelSectionLoadMoreButtonDirective {
  @HostBinding('class') elementClass = 'panel-section-load-more-button';
}

@Component({
  selector: 'panel-section',
  template: `<ng-content></ng-content>`,
  styleUrls: ['./panel-section.component.scss'],
})
export class PanelSectionComponent {}
