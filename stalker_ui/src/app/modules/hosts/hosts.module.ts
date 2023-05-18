import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: ':id/ports/:port',
    loadComponent: () => import('./view-port/view-port.component').then((m) => m.ViewPortComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./view-host/view-host.component').then((m) => m.ViewHostComponent),
  },
  {
    path: '',
    loadComponent: () => import('./list-hosts/list-hosts.component').then((m) => m.ListHostsComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
  providers: [],
})
export class HostsListModule {}
