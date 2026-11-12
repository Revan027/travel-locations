import { Injectable, Signal, signal } from '@angular/core';
import * as L from 'leaflet';
import { Position } from '../models/Position';
import { Router } from '@angular/router';
import { LocationService } from './location.service';
import { Location, LocationMap } from '../models/Location';
import { GeolocalisationService } from './geolocalisation.service';
import { MarkerFactoryService } from './marker-factory.service';
import { UserGeolocalisationService } from './user.geolocalisation.service';
import { AuthentificationService } from './authentification.service';
import { App } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';
import { Timestamp } from 'firebase/firestore';
import { ClusterService } from './cluster.service';
import { Cluster, ClusterMap } from '../models/Cluster';


@Injectable({
    providedIn: 'root',
})
export class MapService {

    _islocatingUsers = signal<boolean>(false);

    islocatingUsers = this._islocatingUsers.asReadonly();

    readonly clusters: Signal<Cluster[]>;

    appResumeListener?: PluginListenerHandle;

    private isMapInit: boolean = false;
    private map!: L.Map;
    private usersMarker: L.Marker<any>[] = [];
    private newLocationMarker?: L.Marker<any>;
    private visibleClusters: ClusterMap[] = [];
    private invisibleClusters: ClusterMap[] = [];
    private zoomMax: Number = 17;

    constructor(
        private router: Router, 
        private locationService: LocationService, 
        private geolocalisationService: GeolocalisationService,
        private authService: AuthentificationService,
        private markerFactoryService: MarkerFactoryService,
        private clusterService: ClusterService,
        private userGeolocalisationService: UserGeolocalisationService) 
    {
        this.clusters = this.clusterService.clusters;
    }

    async init(){
        this.createMap();

        this.locateUsers();

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
            if(this.isMapInit){
                this.updateMapDisplay();
            }        
        });
    }

    initBaseBounds(){
        this.map.fitBounds([[42.3, -4.8], [51.1, 8.2]]); // on définie les contour visuel de la map en coordonnée une fois la map crée et resize pour éviter des incohérences
    }
 
    private createMap(){
        // init de la map leaflet depuis la france. un padding de 10 pour avoir une carte en chargement plus fluide
        this.map = L.map('map', {
            fadeAnimation: false,    // désactive l'animation de fondu des tuiles
            zoomAnimation: true,
            zoomControl: false,
            doubleClickZoom: false,
            minZoom: 6,
            trackResize: false,      // Leaflet ne réagit plus tout seul au resize de la fenêtre (clavier) → plus de redraw/flash. On garde la main via resizeMap().
            renderer: L.svg({padding: 5})}
        )
        .setView([45.706179285330855, 2.9882812500000004], 6)
        .on("resize", (e) => {
          this.isMapInit = true;
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

        this.setIslocatingUsers(true);

        if(loadDatas){
            await this.userGeolocalisationService.loadAll();
        }

        const success = await this.geolocalisationService.getCurrentPosition();

        if (!success){
            this.setIslocatingUsers(false);
            
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

        this.setIslocatingUsers(false);
    }

    placeNewLocationMarker(position: Position){
        this.removeNewLocationMarker();

        this.newLocationMarker = this.markerFactoryService.buildNewLocationMarker(position)

        this.newLocationMarker?.addTo(this.map)

        this.newLocationMarker?.on('click', async (e) => {
            this.router.navigateByUrl(`/locations/create;lat=${e.latlng.lat};lng=${e.latlng.lng}`)
        });
    }
  
    async refreshMap(){
        // todo : ne pas relancer d'action tant que cette tache n'est pas finit
        // todo : revoir l'archi sur les 3 première méthodes, meem si le flow est bon
        // une rehcherche lancé doit cemépcher de relancer uen recherche de suite 
        const clusterIDs = await this.locationService.searchCluster(this.locationService.locationSearchRequest())

        this.clusterService.setClusters(this.clusterService.cacheClusters().filter(x => clusterIDs.includes(x.id)));

        // on parrallèlise les promises des requetes de mise a jour des compteurs filtré
        await Promise.all(this.clusterService.clusters()
            .map((cluster) => this.locationService.getCountSearchByCluster(cluster, this.locationService.locationSearchRequest())))
            .then((result) => 
                this.clusterService.clusters().map((x, index) => x.countLocation = result[index])
            )
       
        this.resetClustersLayer();
        this.resetClusters();     

        this.updateMapDisplay();
    }

    private async updateMapDisplay(){
        const zoom = this.map.getZoom();

        this.getVisibilitiesCluster();

        if(zoom >= 8){
            this.resetClustersLayer();

            // on mettra un timeout pour laisser le temps avant un observable pour annuler une requete si ca va trop vite
            // requetage que le cluster visible sans lieux, donc pas encore en cache. vidages des caches lieux quand on remonte le zoom au cluster
            const promises = this.visibleClusters.map(async(cluster) => {
                if(cluster.locations == undefined){
                    cluster.locations = await this.locationService.searchByClusters([cluster], this.locationService.locationSearchRequest());
                }  
                return Promise.resolve();
            });
       
            await Promise.all(promises)

            this.eachClusters(zoom);
        }
        else{ 
            this.resetClusters();   
            this.resetInvisibleClustersLayer();
            this.drawClusters();
        }
    } 

    getVisibilitiesCluster(){
        // on définit quel cluster sont visible ou non. si les coordonnée du cluster sont dans les coordonnées de la fenètre alors il est visible.
        this.visibleClusters = Object.values(this.clusters()).filter((item: ClusterMap) => this.map.getBounds().intersects(this.getBounds(item)));
        this.invisibleClusters = Object.values(this.clusters()).filter((item: ClusterMap) => !this.map.getBounds().intersects(this.getBounds(item)));
    }

    getCenter(){
        return this.map.getCenter();
    }

    private getBounds(cluster: ClusterMap): L.LatLngBounds{
        return new L.LatLngBounds({lat: cluster.minLat , lng: cluster.minLng} as L.LatLngExpression, {lat: cluster.maxLat , lng: cluster.maxLng} as L.LatLngExpression)
    }

    private drawClusters(){
        // on parcours les clusteurs visible et pas deja sur la carte     
         this.visibleClusters
            .filter(x => x.layer == undefined)
            .map((item: ClusterMap) => {
                const bound = this.getBounds(item),
                    center = bound.getCenter(),
                    radius = center.distanceTo(bound.getNorthEast());

                // on prépare le tooltip
                const tooltip = L.tooltip({permanent: true, direction: "center", opacity: 1, })
                    .setLatLng(center)
                    .setContent(`
                        <div class="cluster-marker">
                            <div class="cluster-marker-counter">
                                ${item.countLocation}
                            </div>
                        </div>`)
                    .openOn(this.map);

                // on ajoute le layer au group
                const layerGroup = L.layerGroup()
                    .addLayer(tooltip)
                    .addTo(this.map)

                item.layer = layerGroup;
            })
    }

    private buildSubClusters(cluster: ClusterMap, zoom: number){
        let locationGroup: LocationMap[][] = [];
        let nextIndex = 0;
        let hasOverlapping: boolean = false;

        let overlappingLocations = cluster.locations?.sort((x, y) => this.map.project([x.latitude, x.longitude], zoom).x < this.map.project([y.latitude, y.longitude], zoom).x ? 1 : -1);
       
        overlappingLocations?.map((location: LocationMap) => {     
            if(locationGroup[nextIndex] == undefined)
            {
                locationGroup[nextIndex] = [];
            }

            const lastEntry = locationGroup[nextIndex].find((value, index) => index == locationGroup[nextIndex].length - 1);

            if(lastEntry){
                hasOverlapping = this.map.project([location.latitude, location.longitude], zoom).distanceTo(this.map.project([lastEntry.latitude, lastEntry.longitude], zoom)) < 32;
             
                if(zoom == this.zoomMax || !hasOverlapping){
                    nextIndex = nextIndex + 1;
                    locationGroup[nextIndex] = [];
                }
                locationGroup[nextIndex].push(location);
            }else{
                locationGroup[nextIndex].push(location);
            }       
        });

        // suppression de tous les sous clusters
        cluster.subClusterLayer?.remove();
        cluster.subClusterLayer = L.layerGroup();

        const subCluster = locationGroup.filter(locationsMap => locationsMap.length > 1);
        const locations = locationGroup.filter(locationsMap => locationsMap.length == 1).map(x => x);

        // gestion des markers de lieux
        locations?.map((locationsMap: LocationMap[]) => {
            locationsMap.map((locationMap: LocationMap) => {
                if(locationMap.marker == undefined){
                    this.drawLocations(locationMap);
                }
            })
        });

        // gestion des markers des sous cluster
        subCluster?.map((locationsMap: LocationMap[]) => {
            locationsMap.map((locationMap: LocationMap) => {
                if(locationMap.marker != undefined){
                    locationMap.marker.remove();
                    locationMap.marker = undefined;
                }
            })
            this.addLayerSubCluster(cluster, locationsMap);   
        });

        cluster.subClusterLayer?.addTo(this.map);
    }

    private addLayerSubCluster(cluster: ClusterMap, locationsMap: LocationMap[]){
         const tooltip = L.tooltip({permanent: true, direction: "center", opacity: 1, })
            .setLatLng([locationsMap[0].latitude, locationsMap[0].longitude])
            .setContent(`
                <div class="cluster-marker">
                    <div class="cluster-marker-counter">
                        ${locationsMap.length}
                    </div>
                </div>`)
            .openOn(this.map);

        // on ajoute le layer au group
        cluster.subClusterLayer?.addLayer(tooltip);
    }

    private drawLocations(locationMap: LocationMap){
        const marker = this.markerFactoryService.buildLocationMarker(locationMap);
        locationMap.marker = marker;
        marker.addTo(this.map);
    }

    private eachClusters(zoom: number){
        // on reset les lieux des clusters dans lequel on se trouve pas ou plus
        this.resetInvisibleClusters();

        // on ajoute les lieux dans les clusters visibles et les markers sur la map, si pa deja fait
        this.visibleClusters
            .map((cluster: ClusterMap) => 
            { 
                this.buildSubClusters(cluster, zoom);
            });
    }

    private resetClusters(){
        this.invisibleClusters.map((cluster) => {
            cluster.subClusterLayer?.remove();
            cluster.subClusterLayer = undefined;

            cluster.locations?.forEach((locationMap: LocationMap) => {
                locationMap.marker?.remove();
            });
            
            cluster.locations = undefined;                     
        });

        this.visibleClusters.map((cluster) => {
            cluster.subClusterLayer?.remove();
            cluster.subClusterLayer = undefined;

           cluster.locations?.forEach((locationMap: LocationMap) => {
                locationMap.marker?.remove();
            });
            
            cluster.locations = undefined;                 
        });
    }

    private resetInvisibleClustersLayer(){
        this.invisibleClusters.map((x) => {
           x.layer?.remove();   
           x.layer = undefined;             
        });
    }

    private resetInvisibleClusters(){
        this.invisibleClusters.map((x) => {
            x.subClusterLayer?.remove();
            x.subClusterLayer = undefined;

            x.locations?.map((y) => {
                y.marker?.remove();
            })  
            
            x.locations = undefined;
        });
    }

    private resetClustersLayer(){
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

    setIslocatingUsers(value: boolean){
        this._islocatingUsers.set(value );
    }
}
