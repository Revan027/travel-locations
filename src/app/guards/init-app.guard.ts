import { inject } from "@angular/core";
import { AppInitService } from "../services/app-init.service";


export const InitAppGuard = () => {
    const appInitService = inject(AppInitService);

    const isAppInit = appInitService.isAppInit.getValue();
    
    return !isAppInit;
}