import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { InitAppGuard } from './guards/init-app.guard';

const routes: Routes = [
    {
        path: 'loading',
        canActivate: [InitAppGuard],
        loadComponent: () =>
            import('./pages/loading/loading.page').then((m) => m.LoadingPage),
    },
    {
        path: '',
        loadChildren: () =>
            import('./menu/menu.module').then((m) => m.MenuModule),
    },
    {
        path: '**',
        redirectTo: '',
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
