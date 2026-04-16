import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LocationsPage } from './locations.page';

const routes: Routes = [
  { 
    path: '', 
    component: LocationsPage,
  },
   {
        path: 'create',
        loadChildren: () =>
          import('../../../pages/locations/edit-location/edit-location.module').then((m) => m.EditLocationPageModule),
      },
      {
        path: ':id',
        loadChildren: () =>
          import('../../../pages/locations/edit-location/edit-location.module').then((m) => m.EditLocationPageModule),
      },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LocationsPageRoutingModule {}
