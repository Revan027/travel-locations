import { Injectable, Signal, signal } from '@angular/core';
import * as L from 'leaflet';
import { Position } from '../models/Position';
import { Router } from '@angular/router';
import { LocationService } from './location.service';
import { Location } from '../models/Location';
import { effect } from '@angular/core';
import { GeolocalisationService } from './geolocalisation.service';
import { MarkerFactoryService } from './marker-factory.service';
import { UserGeolocalisationService } from './user.geolocalisation.service';
import { AuthentificationService } from './authentification.service';
import { App } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { Timestamp } from 'firebase/firestore';
import { ClusterService } from './cluster.service';
import { Cluster } from '../models/Cluster';


@Injectable({
    providedIn: 'root',
})
export class MapService {

    isMapInit = signal<boolean>(false);
    islocatingUsers = signal<boolean>(false);

    readonly clusters2: Signal<Cluster[]>;

    appResumeListener?: PluginListenerHandle;

    private readonly degreeTolerance: number = 1;
    private map!: L.Map;
    private usersMarker: L.Marker<any>[] = [];
    private newLocationMarker?: L.Marker<any>;
    private locations: Location[] = [];
    private visibleClusters: Cluster[] = [];
    private invisibleClusters: Cluster[] = [];

    constructor(
        private router: Router, 
        private locationService: LocationService, 
        private geolocalisationService: GeolocalisationService,
        private authService: AuthentificationService,
        private markerFactoryService: MarkerFactoryService,
        private clusterService: ClusterService,
        private userGeolocalisationService: UserGeolocalisationService) 
    {
        this.clusters2 = this.clusterService.clusters;

        effect(async () => {

           /* this.removeAllLocationMarkers(this.clusters);

            this.removeClustersLayer();*/

            this.resetClusters();

            // appelé à chaque mise à jour du signal de locations
            if (this.locationService.locations().length > 0){

                this.locations = this.locationService.locations();

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
                //this.locateUsers(true);
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
                const id = element?.querySelector("div[data-id]")?.getAttribute("data-id");

                callback = function (event: any){
                    me.router.navigateByUrl(`/locations/${id}`);
                }

               element?.querySelector(".btn-see-location")?.addEventListener("click", callback);
            }
        });

        this.map.on('popupclose', (e) => {
            e.popup.getElement()?.removeEventListener("click", callback)
        });
    }

    private initMoveEndListener(){ 
        this.map.on('moveend', (e) => {
            if(this.isMapInit()){
                this.updateMapDisplay();
            }        
        });
    }

    initBaseBounds(){
        this.map.fitBounds([[41.3, -5.2], [51.1, 9.6]]); // on définie les contour visuel de la map en coordonnée une fois la map crée et resize pour éviter des incohérences
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
        .setView([45.706179285330855, 2.9882812500000004], 6)
        .on("resize", (e) => {
          this.isMapInit.set(true);
        });

        // On ajoute les infos de la map. updateWhenIdle a false pour accéler la chargement des parties de map
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '',  updateWhenIdle: false}).addTo(this.map);

        // On resize direct pour éviter un bug de rendu de la carte
        setTimeout(() => this.resizeMap(), 0);
    }

    resizeMap(){
        this.map?.invalidateSize();
    }

    flyTo(position: Position, lvlZoom: number){
        this.map.flyTo([position.latitude, position.longitude], lvlZoom, {animate: true, duration: 1 });
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

    private async updateMapDisplay(){
        const zoom = this.map.getZoom();

        this.visibleClusters = Object.values(this.clusters2()).filter((item: Cluster) => this.map.getBounds().intersects(this.getBounds(item)));
        this.invisibleClusters = Object.values(this.clusters2()).filter((item: Cluster) => !this.map.getBounds().intersects(this.getBounds(item)));

        if(zoom >= 8){
            this.resetClusters();

            //on requete que le cluster visible sans lieux, donc pas encore en cache.b
            const clusterToLoad = this.getVisibleClustersToLoad();  

            if(clusterToLoad.length > 0){
                this.locations = await this.locationService.getByClusters(clusterToLoad);
            }

            this.drawLocations();
        }
        else{
            //on gère les cluster dans la map   
            this.resetLocations();     
            this.resetInvisibleClusters();
            this.drawClusters();
        }
    } 

    getCenter(){
        return this.map.getCenter();
    }

    private getBounds(cluster: Cluster): L.LatLngBounds{
        return new L.LatLngBounds({lat: cluster.minLat , lng: cluster.minLng} as L.LatLngExpression, {lat: cluster.maxLat , lng: cluster.maxLng} as L.LatLngExpression)
    }

    private getVisibleClustersToLoad(){
        return this.visibleClusters.filter(x => x.locationMarkers == undefined);
    }

    private drawClusters(){
        // on parcours les clusteurs visible et pas deja sur la carte     
         this.visibleClusters
            .filter(x => x.layer == undefined)
            .map((item: Cluster) => {
                const bound = this.getBounds(item),
                    center = bound.getCenter(),
                    radius = center.distanceTo(bound.getNorthEast());

                // on prépare la zone
                const circle = L.circle(center, {stroke: false, 
                    color: 'white',
                    fillColor: 'var(--color-2b3a4e)', // couleur pleine (pas de rgba, sinon le cercle est transparent)
                    fillOpacity: 0.8,
                    radius: 50000 // en mètre
                });

                // on prépare le tooltip
                const tooltip = L.tooltip({permanent: true, direction: "center", opacity: 1})
                    .setLatLng(center)
                    .setContent("<span class='cluster-indicator'>"+1+"</span>")
                    .openOn(this.map);

                // on ajoute le layer au group
                const layerGroup = L.layerGroup([circle])
                    .addLayer(tooltip)
                    .addTo(this.map)

                item.layer = layerGroup;
            })
    }

    private drawLocations(){
        // on reset les lieux des clusters dans lequel on se trouve pas ou plus
        this.invisibleClusters.map((cluster: Cluster) => {
            cluster.locationMarkers?.forEach((marker: L.Marker<any>) => {
                marker.remove();
            });
            
            cluster.locationMarkers = undefined;
        })

        // on ajoute les lieux dans les clusters visibles et les markers sur la map, si pa deja fait
        this.visibleClusters
            .filter(x => x.locationMarkers == undefined)
            .map((cluster: Cluster) => 
            { 
                const locations = this.locations.filter(x => x.clusterID == cluster.id); // recup des lieux du cluster

                cluster.locationMarkers = [];
                
                // on ajoute les markers
                locations.forEach((location: Location) => {
                    const marker = this.markerFactoryService.buildLocationMarker(location); 
                    marker.addTo(this.map);
                   
                    cluster.locationMarkers?.push(marker);               
                })
            });
    }

    private resetLocations(){
        this.invisibleClusters.map((x) => {
            x.locationMarkers?.forEach((marker: L.Marker<any>) => {
                marker.remove();
            });
            
            x.locationMarkers = undefined;                     
        });

        this.visibleClusters.map((x) => {
           x.locationMarkers?.forEach((marker: L.Marker<any>) => {
                marker.remove();
            });
            
            x.locationMarkers = undefined;                   
        });
    }

    private resetInvisibleClusters(){
        this.invisibleClusters.map((x) => {
           x.layer?.remove();   
           x.layer = undefined;                      
        });
    }

    private resetClusters(){
        this.invisibleClusters.map((x) => {
           x.layer?.remove();   
           x.layer = undefined;                      
        });

        this.visibleClusters.map((x) => {
           x.layer?.remove();   
           x.layer = undefined;                      
        });
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
}
