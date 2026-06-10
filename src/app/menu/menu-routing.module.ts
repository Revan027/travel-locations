import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuComponent } from './menu.component';

const routes: Routes = [
    {
        path: '',
        component: MenuComponent,
        children: [
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
                path: 'signout',
                loadChildren: () =>
                    import('../pages/auth/sign-out/sign-out.module').then((m) => m.SignOutPageModule),
            },
            {
                path: 'signin',
                loadChildren: () =>
                    import('../pages/auth/sign-in/sign-in.module').then((m) => m.SignInPageModule),
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
