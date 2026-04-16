import { Injectable, signal } from '@angular/core';
import { LocationType } from '../models/LocationType';
import { Country } from '../models/Country';
import { FirebaseCollectionEnum } from '../constants/firebaseCollectionEnum';
import { FirestoreService } from './firestore.services.common/firestore.service';
import { Location, LocationRequest } from '../models/Location';

@Injectable({
    providedIn: 'root',
})
export class LocationService {   
    locations = signal<Location[]>([]);
    locationTypes = signal<LocationType[]>([]);
    countries = signal<Country[]>([]);

    constructor(private firestoreService: FirestoreService) {}

    async create(locationRequest: LocationRequest){     
 
        // on recup la ref des collections de doonées
        locationRequest.typeRef = this.firestoreService.GetDocumentRef(FirebaseCollectionEnum.country, locationRequest.typeID);
        locationRequest.countryRef = this.firestoreService.GetDocumentRef(FirebaseCollectionEnum.country, locationRequest.country);

        return this.firestoreService.createDocument(FirebaseCollectionEnum.locations, locationRequest);
    }

    async getAll(){
        this.locations.set(await this.firestoreService.getDocuments<Location[]>(FirebaseCollectionEnum.locations));
    }

    async getDatas(){
        // on récupère les types de lieux et les pays une fois
        this.locationTypes.set(await this.firestoreService.getDocuments<LocationType[]>(FirebaseCollectionEnum.locationTypes));
        this.countries.set(await this.firestoreService.getDocuments<Country[]>(FirebaseCollectionEnum.country));
   }
}
