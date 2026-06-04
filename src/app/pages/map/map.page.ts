import { Component, HostListener, WritableSignal } from '@angular/core';
import { MapService } from 'src/app/services/map.service';
import { Position } from 'src/app/models/Position';
import { LocationService } from 'src/app/services/location.service';
import { Location } from 'src/app/models/Location';
import { FormGroup } from '@angular/forms';
import { fromEvent, Subscription } from 'rxjs';
import { PhotonKomootService } from 'src/app/services/photon-komoot.service';
import { PhotonKomootFeature, PhotonKomootResult } from 'src/app/models/PhotonKomootResult';

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
  standalone: false,
})
export class MapPage {
  /*@HostListener('document:click', ['$event'])
  onDocumentClick(event: any) {
  }*/
  private clickSubscription?: Subscription;

  position: WritableSignal<Position> = this.mapService.position;
  locations: WritableSignal<Location[]> = this.locationService.locations;
  isMapInit: WritableSignal<boolean> = this.mapService.isInit;

  isRefreshing = false;
  formGroup!: FormGroup;

  apiSearchLoading = false;
  displayApiSearchModal?: boolean = undefined;
  apiSearchResult?: PhotonKomootResult;
  apiSearchText: string = '';

  constructor(
    private mapService: MapService, 
    private locationService: LocationService,
    private photonKomootService: PhotonKomootService){}

  async ngAfterViewInit(){
    await this.mapService.init();
    await this.locationService.getAll()  
  }

  async ionViewDidEnter(){
    // problème classique Leaflet sur mobile : quand le clavier s'ouvre sur la page de création, il redimensionne le viewport. En revenant sur la map, Leaflet a gardé en mémoire l'ancienne taille du conteneur → rendu partiel.
    this.mapService.resizeMap();
  }

  onSearchModalTransitionEnd(){
    if (this.displayApiSearchModal){
      this.clickSubscription = fromEvent(document, 'click')
        .subscribe(event => {
          let target = event?.target as HTMLElement;

          if (!target.closest(".api-search-modal") && this.displayApiSearchModal){
            this.displayApiSearchModal = false;
          }
        });
    }
    else{
      this.clickSubscription?.unsubscribe();
    }
  }

  async onRefreshPosition(){
    this.isRefreshing = true;

    await this.mapService.initCurrentPosition();
  
    this.mapService.flyTo(this.position() as Position, 17);
    
    this.isRefreshing = false;
  }

  onActiveCreationLocation(){
    this.mapService.createNewLocationMarker();
  } 

  onOpenSearchModal(){
    this.displayApiSearchModal = !this.displayApiSearchModal;
  }

  async onSubmitPhotonKomootSearch(){
    this.apiSearchLoading = true;
    this.apiSearchResult = await this.photonKomootService.search(this.apiSearchText);
    this.apiSearchLoading = false;
  }

  onClickApiFeature(feature: PhotonKomootFeature){
    this.displayApiSearchModal = false;
    console.log(feature)
    const position: Position = {latitude: feature.geometry.coordinates[1], longitude: feature.geometry.coordinates[0]};
    this.mapService.flyTo(position, 17);
  }
}
