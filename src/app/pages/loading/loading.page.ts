import { Component, DestroyRef, ElementRef, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { forkJoin } from 'rxjs';
import { AuthentificationService } from 'src/app/services/authentification.service';
import { LocationService } from 'src/app/services/location.service';
import { UserGeolocalisationService } from 'src/app/services/user.geolocalisation.service';

@Component({
  standalone: true,
  imports: [IonicModule],
  selector: 'app-loading',
  templateUrl: './loading.page.html',
  styleUrls: ['./loading.page.scss'],
})
export class LoadingPage implements OnInit {
  dots: string = ".";
  timer?: number;

 @ViewChild('loadingPage') inputFile!: ElementRef;
  constructor(
    private authentificationService: AuthentificationService, 
    private locationService: LocationService, 
    private userGeolocalisationService: UserGeolocalisationService,
    private router: Router,
    private destroyRef: DestroyRef
    ) { }

  ngOnInit() {
    const p1 = this.authentificationService.intUser();
    const p2 = this.locationService.loadDatas();
    const p3 = this.userGeolocalisationService.loadAll();

    forkJoin([p1, p2, p3])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          clearInterval(this.timer);

          this.router.navigateByUrl('/map');
        },
        error: (err) => {
        },
      });


    this.timer = setInterval(() => {
      if(this.dots.length == 4 ){
        this.dots = "."
      }else{
        this.dots += ".";
      }
    }, 500);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }
}
