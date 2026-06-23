import { Injectable, signal } from '@angular/core';
import { LocationType } from '../models/LocationType';
import { Country } from '../models/Country';
import { FirebaseCollectionEnum } from '../constants/firebaseCollectionEnum';
import { FirestoreService } from './firestore.services.common/firestore.service';
import { Location, LocationRequest } from '../models/Location';
import { DocumentData, DocumentReference, query, QueryConstraint, Timestamp, where } from 'firebase/firestore';
import { LocationSearchRequest } from '../models/LocationSearchRequest';
import moment from 'moment';

@Injectable({
    providedIn: 'root',
})
export class LocationService {   

    locations = signal<Location[]>([]);
    locationTypes = signal<LocationType[]>([]);
    countries = signal<Country[]>([]);
    locationSearchRequest = signal<LocationSearchRequest>(new LocationSearchRequest);
    
    constructor(private firestoreService: FirestoreService) {}

    async getAll(): Promise<Location[]>{
        return this.firestoreService.getDocuments<Location[]>(FirebaseCollectionEnum.locations);
    }

    get(id: string): Promise<Location>{
        return this.firestoreService.getDocument<Location>(FirebaseCollectionEnum.locations, id);
    }

    getRef(id: string): DocumentReference<DocumentData, DocumentData>{
        return this.firestoreService.getDocumentRef(FirebaseCollectionEnum.locations, id);
    }

    getFormatedDate(date: Timestamp, format: string = "DD/MM/YYYY"): string {
        return moment(date.toDate()).format(format);
    }

    async loadAll(): Promise<void>{
        this.locations.set(await this.getAll());
    }

    async loadDatas(): Promise<void>{
        this.locationTypes.set(await this.firestoreService.getDocuments<LocationType[]>(FirebaseCollectionEnum.locationTypes));
        this.countries.set(await this.firestoreService.getDocuments<Country[]>(FirebaseCollectionEnum.country));
    }

    async search(locationSearchRequest: LocationSearchRequest){
        let queryParts: QueryConstraint[] = [];
        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.locations);

        if (locationSearchRequest.limitDate){
            queryParts.push(where("date", "<=", Timestamp.fromDate(new Date(locationSearchRequest.limitDate))));
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
 
        // on recup la ref des collections de données
        locationRequest.typeRef = this.firestoreService.getDocumentRef(FirebaseCollectionEnum.locationTypes, locationRequest.typeID);
        locationRequest.countryRef = this.firestoreService.getDocumentRef(FirebaseCollectionEnum.country, locationRequest.countryID);

        return this.firestoreService.createDocument(FirebaseCollectionEnum.locations, locationRequest);
    }

    async update(id: string, locationRequest: LocationRequest): Promise<void>{
        const ref = this.getRef(id);

        // on recup la ref des collections de données
        locationRequest.typeRef = this.firestoreService.getDocumentRef(FirebaseCollectionEnum.locationTypes, locationRequest.typeID);
        locationRequest.countryRef = this.firestoreService.getDocumentRef(FirebaseCollectionEnum.country, locationRequest.countryID);

        await this.firestoreService.updateDocument(ref, locationRequest);
    }

    async delete(id: string): Promise<void>{
        const ref = this.getRef(id);

        await this.firestoreService.deleteDocument(ref);
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
