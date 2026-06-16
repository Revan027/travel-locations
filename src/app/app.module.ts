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
import { LocationService } from './services/location.service';
import { provideHttpClient } from '@angular/common/http';
import { UserGeolocalisationService } from './services/user.geolocalisation.service';
import { AuthentificationService } from './services/authentification.service';

@NgModule({
  declarations: [AppComponent],
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
    provideHttpClient(),
    provideAppInitializer(async () => {
      // Il faut d'abord faire les injections et ensuite le traitement, sinon on perd le contexte d'injection.
      const authService = inject(AuthentificationService);
      const locationService = inject(LocationService);
      const userGeolocalisationService = inject(UserGeolocalisationService);

      // TODO: afficher un composant loader custom pendant ce chargement (à faire plus tard).
      await authService.intUser();
      await locationService.loadDatas();
      await userGeolocalisationService.loadAll();
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
