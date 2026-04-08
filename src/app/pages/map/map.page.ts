import { Component, OnInit } from '@angular/core';
import { Position } from '@capacitor/geolocation';
import { MapService } from 'src/app/services/map.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
  standalone: false,
})
export class MapPage  {

  position!: Position | null;

  constructor(private mapService: MapService){
  }

  async ngAfterViewInit(){
    this.mapService.initMap();
    this.position = await this.mapService.getCurentPosition();

    if (this.position != null){
      await this.mapService.initCurrentView(this.position);

   
    }   
  }
}
