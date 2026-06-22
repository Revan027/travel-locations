import { Component, HostListener, signal, WritableSignal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { MapService } from 'src/app/services/map.service';
import { Position } from 'src/app/models/Position';
import { LocationService } from 'src/app/services/location.service';
import { Location } from 'src/app/models/Location';
import { FormGroup, FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PhotonKomootService } from 'src/app/services/photon-komoot.service';
import { PhotonKomootFeature, PhotonKomootResult } from 'src/app/models/PhotonKomootResult';
import { LoaderComponent } from 'src/app/components/loader.component';
import { FiltersComponent } from 'src/app/components/filters/filters.component';
import { AuthStatusComponent } from 'src/app/components/auth-status.component';
import { GeolocalisationService } from 'src/app/services/geolocalisation.service';
import { User } from 'src/app/models/User';
import { AuthentificationService } from 'src/app/services/authentification.service';
import { AppInitService } from 'src/app/services/app-init.service';


@Component({
  standalone: true,
  imports: [IonicModule, FormsModule, LoaderComponent, FiltersComponent, AuthStatusComponent],
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
})
export class MapPage {
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.displayApiSearchModal()) return;

    const target = event.target as HTMLElement;

    // on ne ferme pas si le clic est dans le modal ou sur le bouton qui l'ouvre
    if (!target.closest('.api-search-modal') && !target.closest('.btn-api-search-modal')) {
      this.displayApiSearchModal.set(false);
    }
  }

  displayApiSearchModal = signal(false);

  position: WritableSignal<Position> = this.geolocalisationService.position;
  locations: WritableSignal<Location[]> = this.locationService.locations;
  isMapInit: WritableSignal<boolean> = this.mapService.isMapInit;
  user: WritableSignal<User> = this.authService.user;
  islocatingUsers: WritableSignal<boolean> = this.mapService.islocatingUsers;

  formGroup!: FormGroup;
  apiSearchLoading = false;
  apiSearchResult?: PhotonKomootResult;
  apiSearchText: string = '';

  constructor(
    private mapService: MapService,
    private geolocalisationService: GeolocalisationService,
    private locationService: LocationService,
    private photonKomootService: PhotonKomootService, private AppInitService: AppInitService,
    private authService: AuthentificationService)
    {
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
    this.displayApiSearchModal.update(v => !v);
  }

  async onSubmitPhotonKomootSearch(){
    this.apiSearchLoading = true;
    this.apiSearchResult = await this.photonKomootService.search(this.apiSearchText);
    this.apiSearchLoading = false;
  }

  onClickApiFeature(feature: PhotonKomootFeature){
    this.displayApiSearchModal.set(false);
    const position: Position = {latitude: feature.geometry.coordinates[1], longitude: feature.geometry.coordinates[0]};

    this.mapService.flyTo(position, 14);
    this.mapService.placeNewLocationMarker(position);
  }
}
