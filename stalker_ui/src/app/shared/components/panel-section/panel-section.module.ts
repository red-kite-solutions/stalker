import { NgModule } from '@angular/core';

import {
  PanelSectionComponent,
  PanelSectionLinkDirective,
  PanelSectionLoadMoreButtonDirective,
  PanelSectionSubtitleComponent,
  PanelSectionTitleComponent,
} from './panel-section.component';

@NgModule({
  imports: [],
  exports: [
    PanelSectionComponent,
    PanelSectionTitleComponent,
    PanelSectionSubtitleComponent,
    PanelSectionLinkDirective,
    PanelSectionLoadMoreButtonDirective,
  ],
  declarations: [
    PanelSectionComponent,
    PanelSectionTitleComponent,
    PanelSectionSubtitleComponent,
    PanelSectionLinkDirective,
    PanelSectionLoadMoreButtonDirective,
  ],
})
export class PanelSectionModule {}
