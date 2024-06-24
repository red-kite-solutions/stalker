import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-websites/list-websites.component').then((m) => m.ListWebsitesComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./view-website/view-website.component').then((m) => m.ViewWebsiteComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
  providers: [],
})
export class WebsitesListModule {}
