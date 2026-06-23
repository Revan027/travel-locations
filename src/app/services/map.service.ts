import { Injectable, signal } from '@angular/core';
import * as L from 'leaflet';
import { Position } from '../models/Position';
import { Router } from '@angular/router';
import { LocationService } from './location.service';
import { Location } from '../models/Location';
import { effect } from '@angular/core';
import { Cluster } from '../models/Cluster';
import { GeolocalisationService } from './geolocalisation.service';
import { MarkerFactoryService } from './marker-factory.service';
import { UserGeolocalisationService } from './user.geolocalisation.service';
import { AuthentificationService } from './authentification.service';
import { App } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { Timestamp } from 'firebase/firestore';


@Injectable({
    providedIn: 'root',
})
export class MapService {

    isMapInit = signal<boolean>(false);
    islocatingUsers = signal<boolean>(false);

    appResumeListener?: PluginListenerHandle;

    private readonly degreeTolerance: number = 1;
    private map!: L.Map;
    private usersMarker: L.Marker<any>[] = [];
    private newLocationMarker?: L.Marker<any>;
    private locations: Location[] = [];
    private clusters: Cluster[] = [];
    private clustersLayer: L.LayerGroup<any>[] = [];

    constructor(
        private router: Router, 
        private locationService: LocationService, 
        private geolocalisationService: GeolocalisationService,
        private authService: AuthentificationService,
        private markerFactoryService: MarkerFactoryService,
        private userGeolocalisationService: UserGeolocalisationService) 
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

        await this.locateUsers();

        this.initDblClickListener(); 

        this.initPopupListener();

        this.initMoveEndListener();

        this.initAppResumeListener();
    }

    private async initAppResumeListener(){
        await this.appResumeListener?.remove();

        this.appResumeListener = await App.addListener('appStateChange', (event: any) => {
            if (event.isActive && !this.islocatingUsers() && this.map){
                this.locateUsers(true);
            }
      });
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
            const element = e.popup.getElement();

            if(element?.className.includes("location-popup")){
                const id = element?.querySelector("span[data-id]")?.getAttribute("data-id");

                callback = function (event: any){        
                    me.router.navigateByUrl(`/locations/${id}`);
                }

               element?.addEventListener("click", callback); 
            }     
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

    getCenter(){
        return this.map.getCenter();
    }
  
    private createMap(){
        // init de la map leaflet depuis la france. un padding de 10 pour avoir une carte en chargement plus fluide
        this.map = L.map('map', {
            fadeAnimation: false,    // désactive l'animation de fondu des tuiles
            zoomAnimation: true,
            zoomControl: false,
            doubleClickZoom: false,
            minZoom: 5,
            trackResize: false,      // Leaflet ne réagit plus tout seul au resize de la fenêtre (clavier) → plus de redraw/flash. On garde la main via resizeMap().
            renderer: L.svg({padding: 5})}
        )
        .on("load", (e) => {
          this.isMapInit.set(true);
        })
        .setView([45.706179285330855, 2.9882812500000004], 5);
   
        // On ajoute les infos de la map. updateWhenIdle a false pour accéler la chargement des parties de map
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '',  updateWhenIdle: false}).addTo(this.map);

        // On resize direct pour éviter un bug de rendu de la carte
        setTimeout(() => this.resizeMap(), 0);
    }

    resizeMap(){
        this.map?.invalidateSize();
    }

    async locateUsers(loadDatas: boolean = false){
        //on ne lance pas la geoloc si on est pas connecté
        if(!this.authService.user().isAuthenticated){
            return;
        } 

        this.islocatingUsers.set(true);

        if(loadDatas){
            await this.userGeolocalisationService.loadAll();
        }

        const success = await this.geolocalisationService.getCurrentPosition();

        if (!success){
            this.islocatingUsers.set(false);
            
            return;
        } 

        // on recupère les positions des users
        const usersGeoloc = this.userGeolocalisationService.usersGeolocalisation();
        const user = this.userGeolocalisationService.get(this.authService.user().email, usersGeoloc);
        const position = this.geolocalisationService.position();

        if (user){
            user.latitude = position.latitude || 0;
            user.altitude = position.altitude || 0;
            user.longitude = position.longitude || 0;
            user.lastUpdateGeoloc = Timestamp.now();

            // on met à jour les positions sur la carte puis en base pour celle de l'utilisateur
            this.userGeolocalisationService.update(user.id, user)
        }
       
        this.removeUserMarkers();

        // ajout des markers
        usersGeoloc.forEach((userGeoloc) => {
           
            const marker = this.markerFactoryService.buildUserMarker(userGeoloc);
            
            marker.addTo(this.map);
            this.usersMarker?.push(marker);
        });

        this.islocatingUsers.set(false);
    }

    placeNewLocationMarker(position: Position){
        this.removeNewLocationMarker();

        this.newLocationMarker = this.markerFactoryService.buildNewLocationMarker(position)

        this.newLocationMarker?.addTo(this.map)

        this.newLocationMarker?.on('click', async (e) => {
            this.router.navigateByUrl(`/locations/create;lat=${e.latlng.lat};lng=${e.latlng.lng}`)
        });
    }

    private updateMapDisplay(){
        const zoom = this.map.getZoom();

        if(zoom >= 8){
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

    removeUserMarkers(){
        if (this.usersMarker){
          
            this.usersMarker.forEach((marker) => {
                marker.remove();
            })

            this.usersMarker = [];
        }
    }

    removeNewLocationMarker(){
        if (this.newLocationMarker != undefined){
            this.newLocationMarker.remove();
        }
    }

    private resetClusters(){
       this.clusters = [];
    }
}
