import { Component, Signal } from '@angular/core';
import { MapService } from 'src/app/services/map.service';
import { Position } from 'src/app/models/Position';
import { FormGroup } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LocationModalFilterComponent } from 'src/app/components/location-modal-filter/location-modal-filter.component';
import { AuthStatusComponent } from 'src/app/components/auth-status.component';
import { GeolocalisationService } from 'src/app/services/geolocalisation.service';
import { User } from 'src/app/models/User';
import { AuthentificationService } from 'src/app/services/authentification.service';
import { ApiSearchModalComponent } from 'src/app/components/api-search-modal/api-search-modal.component';
import { PhotonKomootService } from 'src/app/services/photon-komoot.service';
import { ClusterService } from 'src/app/services/cluster.service';
import { LocationService } from 'src/app/services/location.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  standalone: true,
  imports: [IonicModule, LocationModalFilterComponent, AuthStatusComponent, ApiSearchModalComponent],
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
})
export class MapPage {

  position: Signal<Position>;
  user: Signal<User>;
  islocatingUsers: Signal<boolean>;

  formGroup!: FormGroup;

  constructor(
    private mapService: MapService,
    private geolocalisationService: GeolocalisationService,
    private locationService: LocationService,
    private clusterService: ClusterService,
    private authService: AuthentificationService,
    private photonKomootService: PhotonKomootService)
  {
    this.user = this.authService.user;
    this.position = this.geolocalisationService.position;
    this.islocatingUsers = this.mapService.islocatingUsers;

    // abonnement au changement de lieux
    this.locationService.locationsChanged$
      ?.pipe(takeUntilDestroyed())
      .subscribe(async () => {
        this.clusterService.setCacheClusters(await this.clusterService.getAll());    
        this.mapService.refreshMap();

      }
    );
  }

  async ngAfterViewInit(){
    await this.mapService.init();
    this.mapService.initBaseBounds();
  }

  async ionViewDidEnter(){
    // problème classique Leaflet sur mobile : quand le clavier s'ouvre sur la page de création, il redimensionne le viewport. En revenant sur la map, Leaflet a gardé en mémoire l'ancienne taille du conteneur → rendu partiel.
    this.mapService.resizeMap();
  }

  async onFilterChanged(emit: boolean){
    this.mapService.refreshMap();
  }

  async onRefreshPosition(){
    await this.mapService.locateUsers(true);
  
    this.mapService.flyTo(this.position() as Position, 17);
  }

  onActiveCreationLocation(){
    this.mapService.placeNewLocationMarker({latitude: this.mapService.getCenter().lat, longitude: this.mapService.getCenter().lng});
  } 

  onOpenSearchModal(){
    this.photonKomootService.updateDisplayModal();
  }
}
