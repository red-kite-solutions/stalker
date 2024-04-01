import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: ':id',
    loadComponent: () => import('./view-domain/view-domain.component').then((m) => m.ViewDomainComponent),
  },
  {
    path: '',
    loadComponent: () => import('./list-domains/list-domains.component').then((m) => m.ListDomainsComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
  providers: [],
})
export class DomainsListModule {}
