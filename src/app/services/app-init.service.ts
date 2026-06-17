import { DestroyRef, Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { AuthentificationService } from './authentification.service';
import { LocationService } from './location.service';
import { UserGeolocalisationService } from './user.geolocalisation.service';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class AppInitService {
  isAppInit = new BehaviorSubject<boolean>(false);

  constructor(
    private authentificationService: AuthentificationService, 
    private locationService: LocationService, 
    private userGeolocalisationService: UserGeolocalisationService,
    private router: Router,
    private destroyRef: DestroyRef
    ) { }
  
  init(): void{
    const p1 = this.authentificationService.intUser();
    const p2 = this.locationService.loadDatas();
    const p3 = this.userGeolocalisationService.loadAll();
    const p4 = this.locationService.loadAll();

    // on attend la résolution des promises
    forkJoin([p1, p2, p3, p4])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          this.isAppInit.next(true);

          this.router.navigateByUrl('/map');
        },
        error: (err) => {
        },
      });
  }
}
