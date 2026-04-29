import { Component, WritableSignal } from '@angular/core';
import { MapService } from 'src/app/services/map.service';
import { Position } from 'src/app/models/Position';
import { LocationService } from 'src/app/services/location.service';
import { Location } from 'src/app/models/Location';

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
  standalone: false,
})
export class MapPage  {

  position: WritableSignal<Position> = this.mapService.position;
  locations: WritableSignal<Location[]> = this.locationService.locations;
  isRefreshing = false;

  constructor(private mapService: MapService, private locationService: LocationService){
  }

  async ngAfterViewInit(){
    await this.locationService.getAll()
    await this.mapService.init();
  }

  async onRefreshPosition(){
    this.isRefreshing = true;

    await this.mapService.initCurrentPosition();
  
    await this.mapService.flyTo(this.position() as Position, 17);
    
    this.isRefreshing = false;
  }

  onActiveCreationLocation(){
    this.mapService.createNewLocationMarker();
  }
}
