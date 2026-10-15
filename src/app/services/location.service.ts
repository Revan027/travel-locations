import { Injectable, signal } from '@angular/core';
import { LocationType } from '../models/LocationType';
import { Country } from '../models/Country';
import { FirebaseCollectionEnum } from '../constants/firebaseCollectionEnum';
import { FirestoreService } from './firestore.services.common/firestore.service';
import { Location, LocationRequest } from '../models/Location';
import { DocumentData, DocumentReference, getCountFromServer, getDoc, limit, orderBy, query, QueryConstraint, startAfter, startAt, Timestamp, where } from 'firebase/firestore';
import { LocationSearchRequest } from '../models/LocationSearchRequest';
import moment from 'moment';
import { Cluster, ClusterRequest } from '../models/Cluster';
import { ClusterService } from './cluster.service';
import { LocationGroup } from '../models/LocationGroup';
import { LocationSearchCounter } from '../models/LocationSearchCounter';
import { Subject } from 'rxjs';


@Injectable({
    providedIn: 'root',
})
export class LocationService {   
    private _locationTypes = signal<LocationType[]>([]);
    private _countries = signal<Country[]>([]);
    private _locationSearchRequest = signal<LocationSearchRequest>(new LocationSearchRequest);
    private _locationDates = signal<string[]>([]);

    locationTypes = this._locationTypes.asReadonly();
    countries = this._countries.asReadonly();
    locationSearchRequest = this._locationSearchRequest.asReadonly();
    locationDates = this._locationDates.asReadonly();

    private _locationsChanged$ = new Subject<boolean>();
    locationsChanged$ = this._locationsChanged$.asObservable();
    
    private readonly degreeTolerance: number = 0.5;

    constructor(private firestoreService: FirestoreService, private clusterService: ClusterService) { 
        moment.locale("fr");  
    }

      
    async create(locationRequest: LocationRequest): Promise<DocumentReference<DocumentData, DocumentData>>{  
        // recherche si un cluster pourrait englober ce lieux   
        const clusters = await this.clusterService.searchByCoord(locationRequest.latitude, locationRequest.longitude);
        let clusterID = "";

        if(clusters.length == 0){ // non trouvé, on créer un nouveau cluster
            let cluster = new ClusterRequest();
            cluster.maxLat = locationRequest.latitude + this.degreeTolerance;
            cluster.minLat = locationRequest.latitude - this.degreeTolerance;
            cluster.maxLng = locationRequest.longitude + this.degreeTolerance;
            cluster.minLng = locationRequest.longitude - this.degreeTolerance;
            cluster.countLocation = 1;

            clusterID = (await this.clusterService.create(cluster)).id;
        }else{ //a voir pour le faire après la création
            // on prend le plus petit ou le premier
            let cluster = clusters.sort((x, y) => x.countLocation < y.countLocation ? 1 : -1).find((e, index) => index == 0) as Cluster ;

            // on met à jour le compteur de lieux
            const counter = await this.getCountLocations([cluster]);
            cluster.countLocation = counter + 1;

           this.clusterService.update(cluster.id, cluster);

           clusterID = cluster.id;
        }

        locationRequest.clusterID = clusterID;

        // on recup la ref des collections de données
        locationRequest.typeRef = this.firestoreService.getDocumentRef(FirebaseCollectionEnum.LocationTypes, locationRequest.typeID);
        locationRequest.countryRef = this.firestoreService.getDocumentRef(FirebaseCollectionEnum.Country, locationRequest.countryID);

        return this.firestoreService.createDocument(FirebaseCollectionEnum.Locations, locationRequest);
    }

    async update(id: string, locationRequest: LocationRequest): Promise<void>{
        const ref = this.getRef(id);

        // on recup la ref des collections de données
        locationRequest.typeRef = this.firestoreService.getDocumentRef(FirebaseCollectionEnum.LocationTypes, locationRequest.typeID);
        locationRequest.countryRef = this.firestoreService.getDocumentRef(FirebaseCollectionEnum.Country, locationRequest.countryID);

        await this.firestoreService.updateDocument(ref, locationRequest);
    }

    async delete(location: Location): Promise<void>{
        const ref = this.getRef(location.id);

        await this.firestoreService.deleteDocument(ref);

        // suppression du clsuter rattaché si il n'y as plus de lieux
        const cluster = await this.clusterService.get(location.clusterID);
        const counter = await this.getCountLocations([cluster]);

        if(cluster.id && counter == 0){
            const cluster = await this.clusterService.getRef(location.clusterID);

            await this.clusterService.delete(cluster.id);
        }else{
            cluster.countLocation = counter;

           this.clusterService.update(cluster.id, cluster);
        }
    }

    async getAll(): Promise<Location[]>{
        return this.firestoreService.getDocuments<Location[]>(FirebaseCollectionEnum.Locations);
    }

    get(id: string): Promise<Location>{
        return this.firestoreService.getDocument<Location>(FirebaseCollectionEnum.Locations, id);
    }
    
    async getAvailableDates(): Promise<any>{
        const [minSnap, maxSnap] = await Promise.all([
            this.firestoreService.getDocuments<Location[]>(FirebaseCollectionEnum.Locations, 'date', 'asc', 1),
            this.firestoreService.getDocuments<Location[]>(FirebaseCollectionEnum.Locations, 'date', 'desc', 1),
        ]);

        return {min: minSnap?.[0].date, max: maxSnap?.[0].date}
    }

    async getCountLocations(clusters: Cluster[]){
        if (!clusters.length) return 0;

        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);
        const snapshot = await getCountFromServer(query(ref, where("clusterID", "in", clusters.map(x => x.id))));

        return snapshot.data().count;
    }

     async getCountSearchByCluster(cluster: Cluster, locationSearchRequest: LocationSearchRequest){
        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);  
        let queryParts: QueryConstraint[] = this.getQuerySearch(locationSearchRequest);

        queryParts.push(where("clusterID", "==", cluster.id));
      
        const snapshot = await getCountFromServer(query(ref, ...queryParts));

        return snapshot.data().count;
    }

    getRef(id: string): DocumentReference<DocumentData, DocumentData>{
        return this.firestoreService.getDocumentRef(FirebaseCollectionEnum.Locations, id);
    }

    getFormatedDate(date?: Timestamp, format: string = "DD/MM/YYYY"): string {
        return date ? moment(date.toDate()).format(format): "";
    }

    async getCounterSearch(locationSearchRequest: LocationSearchRequest): Promise<LocationSearchCounter>{
        let locationSearchCounter = new LocationSearchCounter();
        let queryParts: QueryConstraint[] = this.getQuerySearch(locationSearchRequest);
        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);
               
        const snapshot = await getCountFromServer(query(ref, ...queryParts));

        locationSearchCounter.countLocation = snapshot.data().count;

        return locationSearchCounter;
    }
    
    private getQuerySearch(locationSearchRequest: LocationSearchRequest){
        let queryParts: QueryConstraint[] = [];

        if (locationSearchRequest.beginDate !== undefined){
            queryParts.push(where("date", ">=", locationSearchRequest.beginDate));
        }

        if (locationSearchRequest.endDate !== undefined){
            queryParts.push(where("date", "<=", locationSearchRequest.endDate));
        }

        if (locationSearchRequest.typeIDs != undefined && locationSearchRequest.typeIDs?.length > 0){
            queryParts.push(where("typeID", 'in', locationSearchRequest.typeIDs))
        }

        if (locationSearchRequest.country){
            queryParts.push(where("country", "==", locationSearchRequest.country))
        }

        return queryParts;
    }

    async searchCluster(locationSearchRequest: LocationSearchRequest){
        let queryParts: QueryConstraint[] = this.getQuerySearch(locationSearchRequest);
        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);

        const clusterIDs = (await this.firestoreService.search<Location[]>(query(ref, ...queryParts)))
        .map((x) => x.clusterID)
        .sort();

        return clusterIDs.filter((x, index) => { return x != clusterIDs[index + 1]});
    }

    async searchByClusters(clusters: Cluster[], locationSearchRequest: LocationSearchRequest){
        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);  
        let queryParts: QueryConstraint[] = this.getQuerySearch(locationSearchRequest);

        queryParts.push(where("clusterID", "in", clusters.map(x => x.id))); // attention, pas plus de 30 ids dans le in
      
        return this.firestoreService.search<Location[]>(query(ref, ...queryParts))
    }

    async getNextPage(locationSearchRequest: LocationSearchRequest): Promise<Location[]>{
        let queryParts: QueryConstraint[] = this.getQuerySearch(locationSearchRequest);
        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);

        queryParts.push(orderBy('date', "desc"));
                
        if(locationSearchRequest.currentPage > 1){ // si on est au moins à la seconde page, on doit passer le dernier élément connus à firestore pour démarrer la pagination
            const ref = this.getRef(locationSearchRequest.lastIDResult as string);
            const docSnap = await getDoc(ref);
            
            queryParts.push(startAfter(docSnap));
        }

        queryParts.push(limit(locationSearchRequest.limit));

        return this.firestoreService.search<Location[]>(query(ref, ...queryParts));  
    }

    goupByMonth(locations: Location[], locationGroups: LocationGroup[]){
        // parcours des lieux ajoutés     
        locations.map((location: Location) =>{
            let key = moment(location.date.toDate()).format("MMMM_YYYY");
            let locationGroup = locationGroups.find(x => x.key == key);

            if(locationGroup){ // controle si une clé existe deja. si oui, on le met à la fin du tableau
                locationGroup.results.push(location);
            }else{
                locationGroup = new LocationGroup();
                locationGroup.results.push(location);
                locationGroup.date = moment(location.date.toDate()).format("MMMM YYYY");
                locationGroup.key = key;

                locationGroups.push(locationGroup);
            }
        });

      return locationGroups;
    }

    async loadAvailableDates(){
        this.resetLocationDates();

        const minMax = await this.getAvailableDates();
        const dateMin = moment((minMax.min as Timestamp).toDate()).format("YYYY");
        const dateMax = moment((minMax.max as Timestamp).toDate()).format("YYYY");

        for(let i = Number(dateMin); i <= Number(dateMax); i++){
            this.setLocationDates(i.toString());
        }
    }
  
    async loadDatas(): Promise<void>{
        await this.loadAvailableDates();
        this.setLocationTypes(await this.firestoreService.getDocuments<LocationType[]>(FirebaseCollectionEnum.LocationTypes));
        this.setCountries(await this.firestoreService.getDocuments<Country[]>(FirebaseCollectionEnum.Country));
    }

    setLocationsChanged(){
        this._locationsChanged$.next(true);
    }

    setLocationTypes(value: LocationType[]){
        this._locationTypes.set(value);
    }

    private setLocationDates(value: string){
        let ids = this.locationDates();
        ids.push(value);

        this._locationDates.set(...[ids]); 
    }

    setCountries(value: Country[]){
        this._countries.set(value);
    }

    setLocationSearchRequest(value: LocationSearchRequest){
        this._locationSearchRequest.set(value);
    }

    private resetLocationDates(){
        this._locationDates.set([]);    
    }
}
