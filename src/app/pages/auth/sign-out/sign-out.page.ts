import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { LoaderComponent } from 'src/app/components/loader.component';
import { MapService } from 'src/app/services/map.service';
import { AuthentificationService } from 'src/app/services/authentification.service';

@Component({
  standalone: true,
  imports: [IonicModule, LoaderComponent],
  selector: 'app-sign-out',
  templateUrl: './sign-out.page.html',
  styleUrls: ['./sign-out.page.scss'],
})
export class SignOutPage implements OnInit {

  loading: boolean = false;

  constructor(private location: Location, private authService: AuthentificationService, private mapService: MapService) { }

  ngOnInit() {
  }

  async onSignOut() {
    this.loading = true;

    try {
      // déconnexion vers le mode anonyme
      await this.authService.signInAnonymously();
    } 
    finally {
      // activation du géoloc sur la map
      this.mapService.removeUserMarkers();

      this.cancel();

      this.loading = false;
    } 
  }

  cancel() {
    this.location.back();
  }
}
