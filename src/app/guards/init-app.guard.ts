import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AppInitService } from "../services/app-init.service";


export const InitAppGuard = () => {

    const router = inject(Router);
    const appInitService = inject(AppInitService);

    const isAppInit = appInitService.isAppInit.getValue();
    
    return !isAppInit;
}