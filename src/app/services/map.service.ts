import { Injectable, signal } from '@angular/core';
import { Geolocation, Position as GPosition } from '@capacitor/geolocation';
import * as L from 'leaflet';
import { Position } from '../models/Position';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    constructor(private router: Router) {}

    private map!: L.Map;
    private userMarker?: L.Marker<any>;
    private newLocationMarker?: L.Marker<any>;

    position = signal<Position>(new Position);

    async init(){
        this.createMap();

        await this.initCurrentPosition();

        this.initZoom();
    }

    async initCurrentPosition(){
        await this.getCurentPosition();

        if (this.position() == null){
            return;
        }

        // On supprime l'ancienne position
        if (this.userMarker != undefined){
            this.userMarker.remove();
        }

        this.createUserMarker();

        this.flyTo(this.position() as Position, 17);
    }

    createNewlocationMarker(){
        if (this.newLocationMarker != undefined){
            this.newLocationMarker.remove();
        }

        let latLng = this.map.getCenter();

        this.newLocationMarker = L.marker([latLng.lat, latLng.lng], {draggable: true, shadowPane: ""}).addTo(this.map);

        this.newLocationMarker.on('click', (e) => {
            this.router.navigateByUrl(`/locations/creation;lat=${e.latlng.lat};lng=${e.latlng.lng};alt=${e.latlng.alt}`)
        });
    }

    private createUserMarker(){
        const monIcon = L.divIcon({
           html: '<ion-icon name="accessibility"></ion-icon>',
           iconAnchor: [16, 32],
           popupAnchor: [0, -32],
           className: 'custom-marker'
        });

        this.userMarker = L.marker([this.position().latitude, this.position().longitude], {icon: monIcon}).addTo(this.map);
    }

    private async getCurentPosition(): Promise<boolean>{
        let authorisation = await this.checkAuthorisation();

        if (!authorisation){
            return false;
        }

        const position = await Geolocation.getCurrentPosition({ timeout: 10000, enableHighAccuracy: true }).catch((e)=>{ alert(e); return null; })

        this.position.set({ latitude: position?.coords.latitude, longitude: position?.coords.longitude, altitude: position?.coords.altitude} as Position);

        return true;
    }

    private createMap(){
        // init de la map leaflet depuis le monde.
        this.map = L.map('map', {doubleClickZoom: false,  minZoom: 4}).fitWorld();

        // On ajoute les infos de la map. updateWhenIdle a false pour accéler la chargement des parties de map
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '',  updateWhenIdle: false}).addTo(this.map);

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
