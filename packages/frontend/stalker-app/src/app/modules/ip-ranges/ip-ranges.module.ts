import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: ':id',
    loadComponent: () => import('./view-ip-range/view-ip-range.component').then((m) => m.ViewIpRangeComponent),
  },
  {
    path: '',
    loadComponent: () => import('./list-ip-ranges/list-ip-ranges.component').then((m) => m.ListIpRangesComponent),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
  providers: [],
})
export class IpRangesListModule {}
