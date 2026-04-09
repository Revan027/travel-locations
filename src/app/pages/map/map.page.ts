import { Component, WritableSignal } from '@angular/core';
import { MapService } from 'src/app/services/map.service';
import { Position } from 'src/app/models/Position';

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
  standalone: false,
})
export class MapPage  {

  position: WritableSignal<Position> = this.mapService.position;
  isRefreshing = false;

  constructor(private mapService: MapService){
  }

  async ngAfterViewInit(){
    await this.mapService.init();  
  }

  async onRefreshPosition(){
    this.isRefreshing = true;
    await this.mapService.initCurrentPosition();
    this.isRefreshing = false;
  }
}
