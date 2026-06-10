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
                loadComponent: () =>
                    import('../pages/map/map.page').then((m) => m.MapPage),
            },
            {
                path: 'locations',
                loadChildren: () =>
                    import('../pages/locations/locations/locations.routes').then((m) => m.routes),
            },
            {
                path: 'signout',
                loadComponent: () =>
                    import('../pages/auth/sign-out/sign-out.page').then((m) => m.SignOutPage),
            },
            {
                path: 'signin',
                loadComponent: () =>
                    import('../pages/auth/sign-in/sign-in.page').then((m) => m.SignInPage),
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
