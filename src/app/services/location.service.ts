import { Injectable, signal } from '@angular/core';
import { LocationType } from '../models/LocationType';
import { Country } from '../models/Country';
import { FirebaseCollectionEnum } from '../constants/firebaseCollectionEnum';
import { FirestoreService } from './firestore.services.common/firestore.service';
import { Location, LocationRequest } from '../models/Location';
import { DocumentData, DocumentReference } from 'firebase/firestore';

@Injectable({
    providedIn: 'root',
})
export class LocationService {   
    locations = signal<Location[]>([]);
    locationTypes = signal<LocationType[]>([]);
    countries = signal<Country[]>([]);

    constructor(private firestoreService: FirestoreService) {}

    async create(locationRequest: LocationRequest): Promise<DocumentReference<DocumentData, DocumentData>>{     
 
        // on recup la ref des collections de données
        locationRequest.typeRef = this.firestoreService.GetDocumentRef(FirebaseCollectionEnum.country, locationRequest.typeID);
        locationRequest.countryRef = this.firestoreService.GetDocumentRef(FirebaseCollectionEnum.country, locationRequest.country);

        return this.firestoreService.createDocument(FirebaseCollectionEnum.locations, locationRequest);
    }

    async delete(documentReference: DocumentReference): Promise<void>{
        await this.firestoreService.deleteDocument(documentReference);

        await this.getAll();
    }

    async getAll(): Promise<void>{
        this.locations.set(await this.firestoreService.getDocuments<Location[]>(FirebaseCollectionEnum.locations));
    }

    get(id: string): Promise<Location>{
        return this.firestoreService.getDocument<Location>(FirebaseCollectionEnum.locations, id);
    }

    getRef(id: string): DocumentReference<DocumentData, DocumentData>{
        return this.firestoreService.GetDocumentRef(FirebaseCollectionEnum.locations, id);
    }

    async getDatas(): Promise<void>{
        this.locationTypes.set(await this.firestoreService.getDocuments<LocationType[]>(FirebaseCollectionEnum.locationTypes));
        this.countries.set(await this.firestoreService.getDocuments<Country[]>(FirebaseCollectionEnum.country));
   }
}
