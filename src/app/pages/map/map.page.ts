import { Component, WritableSignal } from '@angular/core';
import { MapService } from 'src/app/services/map.service';
import { Position } from 'src/app/models/Position';
import { LocationService } from 'src/app/services/location.service';
import { Location } from 'src/app/models/Location';
import { FormGroup, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LoaderComponent } from 'src/app/components/loader.component';
import { FiltersComponent } from 'src/app/components/filters/filters.component';
import { AuthStatusComponent } from 'src/app/components/auth-status.component';
import { GeolocalisationService } from 'src/app/services/geolocalisation.service';
import { User } from 'src/app/models/User';
import { AuthentificationService } from 'src/app/services/authentification.service';
import { ApiSearchModalComponent } from 'src/app/components/api-search-modal/api-search-modal.component';
import { PhotonKomootService } from 'src/app/services/photon-komoot.service';


@Component({
  standalone: true,
  imports: [IonicModule, LoaderComponent, FiltersComponent, AuthStatusComponent, ApiSearchModalComponent],
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
})
export class MapPage {

  position: WritableSignal<Position> = this.geolocalisationService.position;
  locations: WritableSignal<Location[]> = this.locationService.locations;
  isMapInit: WritableSignal<boolean> = this.mapService.isMapInit;
  user: WritableSignal<User> = this.authService.user;
  islocatingUsers: WritableSignal<boolean> = this.mapService.islocatingUsers;

  formGroup!: FormGroup;

  constructor(
    private mapService: MapService,
    private geolocalisationService: GeolocalisationService,
    private locationService: LocationService,
    private authService: AuthentificationService,
    private photonKomootService: PhotonKomootService){
  }

  async ngAfterViewInit(){
    await this.mapService.init();
  }

  async ionViewDidEnter(){
    // problème classique Leaflet sur mobile : quand le clavier s'ouvre sur la page de création, il redimensionne le viewport. En revenant sur la map, Leaflet a gardé en mémoire l'ancienne taille du conteneur → rendu partiel.
    this.mapService.resizeMap();
  }

  async onRefreshPosition(){
    await this.mapService.locateUsers(true);
  
    this.mapService.flyTo(this.position() as Position, 17);
  }

  onActiveCreationLocation(){
    this.mapService.placeNewLocationMarker({latitude: this.mapService.getCenter().lat, longitude: this.mapService.getCenter().lng});
  } 

  onOpenSearchModal(){
    this.photonKomootService.displayModal.update(v => !v);
  }
}
