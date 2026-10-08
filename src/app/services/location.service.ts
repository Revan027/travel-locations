import { Injectable, signal } from '@angular/core';
import { LocationType } from '../models/LocationType';
import { Country } from '../models/Country';
import { FirebaseCollectionEnum } from '../constants/firebaseCollectionEnum';
import { FirestoreService } from './firestore.services.common/firestore.service';
import { Location, LocationRequest } from '../models/Location';
import { DocumentData, DocumentReference, getCountFromServer, query, QueryConstraint, Timestamp, where } from 'firebase/firestore';
import { LocationSearchRequest } from '../models/LocationSearchRequest';
import moment from 'moment';
import { Cluster, ClusterRequest } from '../models/Cluster';
import { ClusterService } from './cluster.service';

@Injectable({
    providedIn: 'root',
})
export class LocationService {   
    locations = signal<Location[]>([]);
    locationTypes = signal<LocationType[]>([]);
    countries = signal<Country[]>([]);
    locationSearchRequest = signal<LocationSearchRequest>(new LocationSearchRequest);
    
    private readonly degreeTolerance: number = 0.5;

    constructor(private firestoreService: FirestoreService, private clusterService: ClusterService) {}

    async getAll(): Promise<Location[]>{
        return this.firestoreService.getDocuments<Location[]>(FirebaseCollectionEnum.Locations);
    }

    get(id: string): Promise<Location>{
        return this.firestoreService.getDocument<Location>(FirebaseCollectionEnum.Locations, id);
    }
 
    async getByClusters(clusters: Cluster[]){
        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);

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
        this.locations.set(await this.getAll());
    }

    async loadDatas(): Promise<void>{
        this.locationTypes.set(await this.firestoreService.getDocuments<LocationType[]>(FirebaseCollectionEnum.LocationTypes));
        this.countries.set(await this.firestoreService.getDocuments<Country[]>(FirebaseCollectionEnum.Country));
    }

    async search(locationSearchRequest: LocationSearchRequest){
        let queryParts: QueryConstraint[] = [];
        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);

        if (locationSearchRequest.limitDate !== undefined){
            queryParts.push(where("date", "<=", locationSearchRequest.limitDate));
        }

        if (locationSearchRequest.typeIDs.length > 0){
            queryParts.push(where("typeID", 'in', locationSearchRequest.typeIDs))
        }

        if (locationSearchRequest.country){
            queryParts.push(where("country", "==", locationSearchRequest.country))
        }

        this.locations.set(await this.firestoreService.search<Location[]>(query(ref, ...queryParts)));    
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

    goupByType(): { [key: string]: Location[] }{
        let groupLocation: { [key: string]: Location[] } = {};

        let sort = this.locations()
            .sort((a, b) => 
            {
                return a.typeName
                    .replace(/[^a-zA-Z0-9]/g, '') // on remplace les caractères qui ne sont pas des lettres puis on compare sans case sensitive
                    .localeCompare(b.typeName.replace(/[^a-zA-Z0-9]/g, ''), "fr", { sensitivity: "base" }) > 0 ? 1 : -1 
            });
        
        sort.map((item: Location) => {

            // si la clé existe pas on la crée à partir du type
            if (groupLocation[item.typeName] == undefined){
                groupLocation[item.typeName] = []
            }

            groupLocation[item.typeName].push(item);
        }); 

        return groupLocation;
    }

    sortLocation(groups: { [key: string]: Location[] }){
        Object.entries(groups).forEach((item) => {
            return item[1].sort((a, b) => a.date.toDate() < b.date.toDate()  ? 1 : -1)
        });
    }
}
