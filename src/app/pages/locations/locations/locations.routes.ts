import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./locations.page').then((m) => m.LocationsPage),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('../edit-location/edit-location.page').then((m) => m.EditLocationPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../edit-location/edit-location.page').then((m) => m.EditLocationPage),
  },
];
