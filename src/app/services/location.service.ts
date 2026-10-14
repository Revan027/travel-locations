import { Injectable, signal } from '@angular/core';
import { LocationType } from '../models/LocationType';
import { Country } from '../models/Country';
import { FirebaseCollectionEnum } from '../constants/firebaseCollectionEnum';
import { FirestoreService } from './firestore.services.common/firestore.service';
import { Location, LocationRequest } from '../models/Location';
import { collection, DocumentData, DocumentReference, getCountFromServer, getDoc, limit, orderBy, query, QueryConstraint, startAfter, startAt, Timestamp, where } from 'firebase/firestore';
import { LocationSearchRequest } from '../models/LocationSearchRequest';
import moment from 'moment';
import { Cluster, ClusterRequest } from '../models/Cluster';
import { ClusterService } from './cluster.service';
import { LocationGroup } from '../models/LocationGroup';


@Injectable({
    providedIn: 'root',
})
export class LocationService {   
    _locations = signal<Location[]>([]);
    _locationTypes = signal<LocationType[]>([]);
    _countries = signal<Country[]>([]);
    _locationSearchRequest = signal<LocationSearchRequest>(new LocationSearchRequest);

    locations = this._locations.asReadonly();
    locationTypes = this._locationTypes.asReadonly();
    countries = this._countries.asReadonly();
    locationSearchRequest = this._locationSearchRequest.asReadonly();
    
    private readonly degreeTolerance: number = 0.5;

    constructor(private firestoreService: FirestoreService, private clusterService: ClusterService) { 
        moment.locale("fr");  
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
 
    async getByClusters(clusters: Cluster[]){
        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);
        // attention, pas plus de 30 ids dans le in
        return this.firestoreService.search<Location[]>(query(ref, where("clusterID", "in", clusters.map(x => x.id))))
    }

    async getCountLocations(clusters: Cluster[]){
        if (!clusters.length) return 0;

        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);
        const snapshot = await getCountFromServer(query(ref, where("clusterID", "in", clusters.map(x => x.id))));

        return snapshot.data().count;
    }

    getRef(id: string): DocumentReference<DocumentData, DocumentData>{
        return this.firestoreService.getDocumentRef(FirebaseCollectionEnum.Locations, id);
    }

    getFormatedDate(date?: Timestamp, format: string = "DD/MM/YYYY"): string {
        return date ? moment(date.toDate()).format(format): "";
    }
    
    async loadAll(): Promise<void>{  
        this.setLocations(await this.getAll());
    }

    async loadDatas(): Promise<void>{
        this.setLocationTypes(await this.firestoreService.getDocuments<LocationType[]>(FirebaseCollectionEnum.LocationTypes));
        this.setCountries(await this.firestoreService.getDocuments<Country[]>(FirebaseCollectionEnum.Country));
    }

    private getQuerySearch(locationSearchRequest: LocationSearchRequest){
        let queryParts: QueryConstraint[] = [];

        if (locationSearchRequest.limitDate !== undefined){
            queryParts.push(where("date", "<=", locationSearchRequest.limitDate));
        }

        if (locationSearchRequest.beginDate !== undefined){
            queryParts.push(where("date", ">=", locationSearchRequest.beginDate));
        }

        if (locationSearchRequest.endDate !== undefined){
            queryParts.push(where("date", "<=", locationSearchRequest.endDate));
        }

        if (locationSearchRequest.typeIDs.length > 0){
            queryParts.push(where("typeID", 'in', locationSearchRequest.typeIDs))
        }

        if (locationSearchRequest.country){
            queryParts.push(where("country", "==", locationSearchRequest.country))
        }

        return queryParts;
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
    
    async create(locationRequest: LocationRequest): Promise<DocumentReference<DocumentData, DocumentData>>{  
        // recherche si un cluster pourrait englober ce lieux   
        const clusters = await this.clusterService.search(locationRequest.latitude, locationRequest.longitude);
        let clusterID = "";
;
        if(clusters.length == 0){ // non trouvé, on créer un nouveau cluster
            let cluster = new ClusterRequest();
            cluster.maxLat = locationRequest.latitude + this.degreeTolerance;
            cluster.minLat = locationRequest.latitude - this.degreeTolerance;
            cluster.maxLng = locationRequest.longitude + this.degreeTolerance;
            cluster.minLng = locationRequest.longitude - this.degreeTolerance;
            cluster.countLocation = 1;

            clusterID = (await this.clusterService.create(cluster)).id;
        }else{ 
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

    setLocations(value: Location[]){
        this._locations.set(value);
    }

    setLocationTypes(value: LocationType[]){
        this._locationTypes.set(value);
    }

    setCountries(value: Country[]){
        this._countries.set(value);
    }

    setLocationSearchRequest(value: LocationSearchRequest){
        this._locationSearchRequest.set(value);
    }
}
