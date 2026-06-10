import { Injectable, signal } from '@angular/core';

import * as L from 'leaflet';
import { Position } from '../models/Position';
import { Router } from '@angular/router';
import { LocationService } from './location.service';
import { Location } from '../models/Location';
import { effect } from '@angular/core';
import moment from 'moment';
import { Cluster } from '../models/Cluster';
import { HttpService } from './services.common/http-service';
import { environment } from 'src/environments/environment';
import { GeolocalisationService } from './geolocalisation.service';
import { MarkerFactoryService } from './marker.factory.service';


@Injectable({
    providedIn: 'root',
})
export class MapService {

    isInit = signal<boolean>(false);

    private readonly degreeTolerance: number = 1;
    private map!: L.Map;
    private userMarker?: L.Marker<any>;
    private newLocationMarker?: L.Marker<any>;
    private locations: Location[] = [];
    private clusters: Cluster[] = [];
    private clustersLayer: L.LayerGroup<any>[] = [];

    constructor(
        private router: Router, 
        private locationService: LocationService, 
        private geolocalisationService: GeolocalisationService, 
        private httpService: HttpService, 
        private markerFactoryService: MarkerFactoryService) 
    {
        effect(async () => {

            this.removeAllLocationMarkers(this.clusters);

            this.removeClustersLayer();

            this.resetClusters();

            // appelé à chaque mise à jour du signal de locations
            if (this.locationService.locations().length > 0){

                this.locations = this.locationService.locations();

                this.buildClusters();

                this.updateMapDisplay();
            }
        });
    }

    async init(){
        this.createMap();

        await this.locateUser();

        this.initDblClickListener(); 

        this.initPopupListener();

        this.initMoveEndListener();
    }

    

    private initDblClickListener(){
        this.map.on('dblclick', (e: L.LeafletMouseEvent) => {
            const position: Position = {latitude: e.latlng.lat, longitude: e.latlng.lng};

            this.flyTo(position, 17);
        });
    }

    private initPopupListener(){
        var me = this,
            callback: any;

        this.map.on('popupopen', (e) => {
            const id = e.popup.getElement()?.querySelector("span[data-id]")?.getAttribute("data-id");

            callback = function (event: any){        
                me.router.navigateByUrl(`/locations/${id}`);
            }
            e.popup.getElement()?.addEventListener("click", callback);      
        });

        this.map.on('popupclose', (e) => {
            e.popup.getElement()?.removeEventListener("click", callback)
        });
    }

    private initMoveEndListener(){ 
        this.map.on('moveend', () => {
            this.updateMapDisplay();
        });
    }

    async locateUser(){
        const success = await this.geolocalisationService.getCurrentPosition();

        if (!success) return;

        this.removeUserMarker();

        this.userMarker = this.markerFactoryService.createUserMarker(this.geolocalisationService.position().latitude, this.geolocalisationService.position().longitude);
        this.userMarker.addTo(this.map);
    }

    placeNewLocationMarker(){
        this.removeNewLocationMarker();

        const marker = this.markerFactoryService.buildNewLocationMarker(this.map.getCenter())

        marker.addTo(this.map)

        marker.on('click', async (e) => {
            this.router.navigateByUrl(`/locations/create;lat=${e.latlng.lat};lng=${e.latlng.lng}`)
        });
    }

    private updateMapDisplay(){
        const zoom = this.map.getZoom();

        if (zoom >= 8){
            this.removeClustersLayer();

            this.drawLocationsInBounds(this.map.getBounds());
        }
        else if(this.clustersLayer.length == 0){
            this.removeAllLocationMarkers(this.clusters);

            this.drawClusters();
        }
    }

    private drawClusters(){
        // on parcours les clusteurs pour dessiner la zone
        this.clusters.map((item: Cluster)=> {
           const bounds = item.bounds,
                center = bounds.getCenter(),
                radius = center.distanceTo(bounds.getNorthEast());

            // on prépare la zone
            const circle = L.circle(center, {
                color: 'transparent',
                fillColor: 'var(--app-amber)',
                fillOpacity: 0.5,
                radius: radius < 50000 ? 50000 : radius // en mètre
            });

            // on prépare le tooltip
            const tooltip = L.tooltip({permanent: true, direction: "center"})
                .setLatLng(center)
                .setContent(item.locations.length.toString())
                .openOn(this.map);

            // on ajoute le layer au group
            const layerGroup = L.layerGroup([circle])
                .addLayer(tooltip)
                .addTo(this.map)

            this.clustersLayer.push(layerGroup);
        })
    }

    private drawLocationsInBounds(bound: L.LatLngBounds){
        this.clusters.map((cluster: Cluster)=> 
        { 
            // Si la frontière visible est compris
            if(bound.intersects(cluster.bounds))
            {
                cluster.locations.forEach((location: Location) => {
                    // on ajoute un marker s'il est pas déja présent
                    if(!cluster.locationsMarker.some((item: L.Marker<any>) => item.getLatLng().lat == location.latitude && item.getLatLng().lng == location.longitude)){
                        const marker = this.markerFactoryService.buildLocationMarker(location); 

                        marker.addTo(this.map);

                        cluster.locationsMarker.push(marker);
                    }                  
                })
            }
            else{
               this.removeLocationMarkers(cluster);
            }
        });
    }
    
    private buildClusters(){
        // on prend la permière entrée et on regarde si on a une concordance. Ensuite on l'injecte dans le cluster.
        let locationCompare = this.locations[0],
            maxLat = locationCompare.latitude + this.degreeTolerance,
            minLat = locationCompare.latitude - this.degreeTolerance,
            maxLng = locationCompare.longitude + this.degreeTolerance,
            minLng = locationCompare.longitude - this.degreeTolerance;

        // on filtre par rapport au lieu recup ceux qui sont près de lui. Avec une tolérance de 2°.
        let locations = this.locations.filter((item: Location)=> {
            return (item.latitude <= maxLat && item.latitude >= minLat) && (item.longitude <= maxLng && item.longitude >= minLng);
        });

        if (!locations){
           locations = [locationCompare];
        }

        // création du cluster
        this.clusters.push({
            locationsMarker: [],
            locations: locations,
            bounds: L.latLngBounds(locations.map(x => ({ lat: x.latitude, lng: x.longitude })))
        });

        // on retire les lieux mis dans le cluster
        this.locations = this.locations.filter((item: Location)=> {
           return item.id != locationCompare.id && !locations.some(x => x.id == item.id)
        })

        // récursif si on a encore des lieux a traiter
        if(this.locations.length > 0){
            this.buildClusters();
        }
    }

    flyTo(position: Position, lvlZoom: number){
        this.map.flyTo([position.latitude, position.longitude], lvlZoom, {animate: true, duration: 1 });
    }

    private resetClusters(){
       this.clusters = [];
    }

    private removeAllLocationMarkers(clusters: Cluster[]){
        clusters.forEach((cluster: Cluster) => {
           this.removeLocationMarkers(cluster);
        })
    }

    private removeLocationMarkers(cluster: Cluster){
        cluster.locationsMarker.forEach((marker: L.Marker<any>) => {
            marker.remove();
        })

        cluster.locationsMarker = [];
    }

    private removeClustersLayer(){
        this.clustersLayer.map((x) => {
            x.getLayers().map(y => {
                L.DomUtil.get(y.getPane() ?? '')?.classList.add("removed")
            });

            // on attend la fin de l'animation pour retirer la classe anim du wrapper, et on supprime les layers
            setTimeout(()=> {
                x.getLayers().map(y => {
                    L.DomUtil.get(y.getPane() ?? '')?.classList.remove("removed")
                });

                x.remove();
            },800)                                    
        });

        this.clustersLayer = [];
    }

    removeUserMarker(){
        if (this.userMarker != undefined){
            this.userMarker.remove();
        }
    }

    removeNewLocationMarker(){
        if (this.newLocationMarker != undefined){
            this.newLocationMarker.remove();
        }
    }



    getAltitude(lat: number, lng: number) {
       return this.httpService.get<any>(environment.apiOpenMeteo.replace("{X}", lat.toString()).replace("{Y}", lng.toString()))
    }

   

    private createMap(){
        // init de la map leaflet depuis la france. un padding de 10 pour avoir une carte en chargement plus fluide
        this.map = L.map('map', { 
            fadeAnimation: false,    // désactive l'animation de fondu des tuiles
            zoomAnimation: true,
            zoomControl: false,
            doubleClickZoom: false,  
            minZoom: 4, 
            renderer: L.svg({padding: 5})}
        )
        .on("load", (e) => {
          this.isInit.set(true);
        })
        .setView([45.706179285330855, 2.9882812500000004], 4);
   
        // On ajoute les infos de la map. updateWhenIdle a false pour accéler la chargement des parties de map
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '',  updateWhenIdle: false}).addTo(this.map);

        // On resize direct pour éviter un bug de rendu de la carte
        setTimeout(() => this.resizeMap(), 0);
    }

    resizeMap(){
        this.map?.invalidateSize();
    }
}
