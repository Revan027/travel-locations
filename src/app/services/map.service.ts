import { Injectable } from '@angular/core';
import { Geolocation, GeolocationPluginPermissions, Position } from '@capacitor/geolocation';
import * as L from 'leaflet';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    constructor() {}

    private map!: L.Map;

    initMap(){
        // init de la map leaflet depuis le monde.
        this.map = L.map('map', {doubleClickZoom: false,  minZoom: 3}).fitWorld();

        // On ajoute les infos de la map
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: ''}).addTo(this.map);

        // On resize direct pour éviter un bug de rendu de la carte
        setTimeout(() => this.map.invalidateSize(), 0);    
    }

    initCurrentView(position: Position){
       this.map.setView([position.coords.latitude, position.coords.longitude], 13); 

          const monIcon = L.divIcon({
           html: '<ion-icon name="locate-outline" style="font-size: 32px; color: red;"></ion-icon>',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
           className: 'custom-marker'
        });
      
        L.marker([position.coords.latitude, position.coords.longitude], { icon: monIcon}).addTo( this.map);

    }

    async getCurentPosition(): Promise<Position | null>{
        let authorisation = await this.checkAuthorisation();

        if (!authorisation){
            return null;
        }

        const position = await Geolocation.getCurrentPosition().catch(()=>{ return null; })

        return position;
    }

    async checkAuthorisation(): Promise<boolean>{
        let permission = await Geolocation.checkPermissions();

        if (permission.location != "granted"){
            permission = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation']})

            return permission.location == "granted";
        }

        return permission.location == "granted";
    }
}
