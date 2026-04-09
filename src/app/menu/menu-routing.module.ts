import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuComponent } from './menu.component';

const routes: Routes = [
    {
        path: '',
        component: MenuComponent,
        children: [
            {
                path: 'home',
                loadChildren: () =>
                    import('../home/home.module').then((m) => m.HomePageModule),
            },
            {
                path: 'map',
                loadChildren: () =>
                    import('../pages/map/map.module').then((m) => m.MapPageModule),
            },
            {
                path: 'locations',
                loadChildren: () =>
                    import('../pages/locations/locations/locations.module').then((m) => m.LocationsPageModule),
            },
            {
                path: 'profil',
                loadChildren: () =>
                    import('../pages/profil/profil.module').then((m) => m.ProfilPageModule),
            },
            {
                path: '',
                redirectTo: 'map',
                pathMatch: 'full',
            },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
})
export class MenuRoutingModule {}
