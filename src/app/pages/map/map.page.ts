import { Component, WritableSignal } from '@angular/core';
import { MapService } from 'src/app/services/map.service';
import { Position } from 'src/app/models/Position';
import { LocationService } from 'src/app/services/location.service';
import { Location } from 'src/app/models/Location';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
  standalone: false,
})
export class MapPage {

  position: WritableSignal<Position> = this.mapService.position;
  locations: WritableSignal<Location[]> = this.locationService.locations;
  isMapInit: WritableSignal<boolean> = this.mapService.isInit;

  isRefreshing = false;
  formGroup!: FormGroup;

  constructor(
    private mapService: MapService, 
    private locationService: LocationService){}

  async ngAfterViewInit(){
    await this.mapService.init();
    await this.locationService.getAll()  
  }

  async ionViewDidEnter(){
    // problème classique Leaflet sur mobile : quand le clavier s'ouvre sur la page de création, il redimensionne le viewport. En revenant sur la map, Leaflet a gardé en mémoire l'ancienne taille du conteneur → rendu partiel.
    this.mapService.resizeMap();
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
}
