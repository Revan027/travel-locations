import { Injectable, signal } from '@angular/core';
import { Geolocation, Position as GPosition } from '@capacitor/geolocation';
import * as L from 'leaflet';
import { Position } from '../models/Position';
import { Router } from '@angular/router';
import { LocationService } from './location.service';
import { Location } from '../models/Location';
import { effect } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class MapService {
    constructor(private router: Router, private locationService: LocationService) {
        effect(() => {
            console.log(this.locationService.locations()); // appelé à chaque mise à jour du signal appéllé dedans
        });
    }

    private degreeTolerance: number = 2;
    private map!: L.Map;
    private userMarker?: L.Marker<any>;
    private newLocationMarker?: L.Marker<any>;
    private locations: Location[] = [];
    private clusters: any[] = [];

    private clustersLayer: L.LayerGroup<any>[] = [];

    position = signal<Position>(new Position);

    async init(){
        this.createMap();

        await this.initCurrentPosition();

        this.initZoom();

        this.locations =  this.locationService.locations();

       /* this.locations.map((item: Location)=> {
            let marker = this.createLocationMarker(item);  //console.log(item.latitude, item.longitude);
           
        });*/

        this.getClusters();

        this.drawClusters();

        this.initMoveMap();
    }

    private drawClusters(){
        // on parcours les clusteurs pour dessiner la zone
        this.clusters.map((item: [Location])=> {
           const bounds = L.latLngBounds(item.map(x => [x.latitude, x.longitude])),
                center = bounds.getCenter(),
                radius = center.distanceTo(bounds.getNorthEast());

            // on prépare la zone
            const circle = L.circle(center, {
                color: 'var(--app-amber)',
                fillColor: 'var(--app-amber)',
                fillOpacity: 0.5,
                radius: radius < 50000 ? 50000 : radius // en mètre
            });

            // on prépare le tooltip
            const tooltip = L.tooltip({permanent: true, direction: "center"})
                .setLatLng(center)
                .setContent(item.length.toString())
                .openOn(this.map);

            // on ajoute le layer au group
            const layerGroup = L.layerGroup([circle])
                .addLayer(tooltip)
                .addTo(this.map)

            this.clustersLayer.push(layerGroup);
        })
    }
    
    private getClusters(){  
        // on prend la permière entrée et on regarde si on a une concordance. Ensuite on l'injecte dans le cluster.
        let locationCompare = this.locations[0],
            maxLat = locationCompare.latitude + this.degreeTolerance,
            minLat = locationCompare.latitude - this.degreeTolerance,
            maxLng = locationCompare.longitude + this.degreeTolerance,
            minLng = locationCompare.longitude - this.degreeTolerance;

        // on filtre par rapport au lieu recup ceux qui sont près de lui. Avec une tolérance de 2°.
        let result = this.locations.filter((item: Location)=> {
            return (item.latitude <= maxLat && item.latitude >= minLat) && (item.longitude <= maxLng && item.longitude >= minLng);
        });

        if (result){
            this.clusters.push(result) 
        }
        else{
          this.clusters.push([locationCompare])
        }

        // on retire les lieux mis dans le cluster
        this.locations = this.locations.filter((item: Location)=> {
           return item.id != locationCompare.id && !result.some(x => x.id == item.id) 
        })

        // récursif si on a encore des lieux a traiter
        if(this.locations.length > 0){
            this.getClusters();
        }  
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
    }

    createNewlocationMarker(){
        if (this.newLocationMarker != undefined){
            this.newLocationMarker.remove();
        }

        let latLng = this.map.getCenter();

        const newLocationIcon = L.divIcon({
            html: '<ion-icon name="location"></ion-icon>',
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
            className: 'custom-marker'
        });

        this.newLocationMarker = L.marker([latLng.lat, latLng.lng], {draggable: true, icon: newLocationIcon}).addTo(this.map);

        this.newLocationMarker.on('click', (e) => {
            this.router.navigateByUrl(`/locations/creation;lat=${e.latlng.lat};lng=${e.latlng.lng};alt=${e.latlng.alt}`)
        });
    }

    createLocationMarker(location: Location): L.Marker{
        const locationIcon = L.divIcon({
            html: `<span class="material-icons">${location.typeIcon}</span>`,
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
            className: 'custom-marker'
        });

        return L.marker([location.latitude, location.longitude], {icon: locationIcon}).addTo(this.map);

        /*this.newLocationMarker.on('click', (e) => {
            this.router.navigateByUrl(`/locations/creation;lat=${e.latlng.lat};lng=${e.latlng.lng};alt=${e.latlng.alt}`)
        });*/
    }

    flyTo(position: Position, lvlZoom: number){
        this.map.flyTo([position.latitude, position.longitude], lvlZoom, {animate: true, duration: 1 });
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
        // init de la map leaflet depuis la france.
        this.map = L.map('map', {doubleClickZoom: false,  minZoom: 4}).setView([45.706179285330855, 2.9882812500000004], 4);
   
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

    private initMoveMap(){      
        this.map.on('moveend', () => {
            // En fonction du niveau de zoom, on affiche les clusters ou les lieux
            const center = this.map.getCenter();
            const zoom = this.map.getZoom();
             const bounds = this.map.getBounds();
                //console.log(bounds, zoom);

            // On charge les icones visible
        });
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
