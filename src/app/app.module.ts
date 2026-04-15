import { inject, NgModule, provideAppInitializer } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { environment } from 'src/environments/environment';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { LoaderComponent } from './components/loader.component';
import { LocationService } from './services/location.service';
import { FirestoreService } from './services/firestore.services.common/firestore.service';

@NgModule({
    declarations: [AppComponent, LoaderComponent],
    exports: [LoaderComponent],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideFirestore(() => getFirestore()),
        provideAuth(() => getAuth()),
        provideAppInitializer(async () => {
            // Il faut d'abord faire les injections et ensuite faire le traitement. Sinon on perd le contexte d'injection.
            const fileService = inject(FirestoreService);
            const locationService = inject(LocationService);

            fileService.signIn();
            locationService.getDatas();
        }),
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
