import { Component, signal, WritableSignal } from '@angular/core';
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

  onActiveCreationLocation(){
    this.mapService.createNewlocationMarker();
    // on ajoute un point au mileu de la carte
    //ce point sera un point temporaire
    // on bascule ensite l'icone du boutton d'ajout en valider, pour valider le point.
    //On peut déplacer le point en drag an drop   <ion-icon name="pin-outline"></ion-icon>
  }
}
