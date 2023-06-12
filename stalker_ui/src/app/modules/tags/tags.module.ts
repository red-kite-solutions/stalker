import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./manage-tags/manage-tags.component').then((m) => m.ManageTagsComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
  providers: [],
})
export class TagsModule {}
