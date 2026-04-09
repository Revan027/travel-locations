import { Injectable } from '@angular/core';
import { Geolocation, GeolocationPluginPermissions, Position as GPosition } from '@capacitor/geolocation';
import * as L from 'leaflet';
import { Position } from '../models/Position';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    constructor() {}

    private map!: L.Map;

    init(){
        this.createMap();

        this.initZoom();
    }

    initCurrentView(position: Position){
        this.flyTo(position, 13);

          const monIcon = L.divIcon({
           html: '<ion-icon name="accessibility-outline" style="font-size: 25px; color: red;"></ion-icon>',
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
           className: 'custom-marker'
        });
      
        L.marker([position.latitude, position.longitude], { icon: monIcon}).addTo( this.map);
       
    }

    async getCurentPosition(): Promise<Position | null>{
        let authorisation = await this.checkAuthorisation();

        if (!authorisation){
            return null;
        }

        const position = await Geolocation.getCurrentPosition({ timeout: 10000, enableHighAccuracy: true }).catch((e)=>{ alert(e); return null; })

        return { latitude: position?.coords.latitude, longitude: position?.coords.longitude, altitude: position?.coords.altitude} as Position;
    }

    private createMap(){
         // init de la map leaflet depuis le monde.
        this.map = L.map('map', {doubleClickZoom: false,  minZoom: 3}).fitWorld();

        // On ajoute les infos de la map
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: ''}).addTo(this.map);

        // On resize direct pour éviter un bug de rendu de la carte
        setTimeout(() => this.map.invalidateSize(), 0);    
    }

    private initZoom(){
        this.map.on('dblclick', (e: L.LeafletMouseEvent) => {
            const position: Position = {latitude: e.latlng.lat, longitude: e.latlng.lng};

            this.flyTo(position, 17);
        });
    }

    private flyTo(position: Position, lvlZoom: number){
        this.map.flyTo([position.latitude, position.longitude], lvlZoom, {animate: true, duration: 1 }); 
    }

    private async checkAuthorisation(): Promise<boolean>{
        let permission = await Geolocation.checkPermissions();

        if (permission.location != "granted"){
            permission = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation']})

            return permission.location == "granted";
        }

        return permission.location == "granted";
    }
}
