import { Injectable, signal } from '@angular/core';
import { LocationType } from '../models/LocationType';
import { Country } from '../models/Country';

import { FirebaseCollectionEnum } from '../constants/firebaseCollectionEnum';
import { FirestoreService } from './firestore.services.common/firestore.service';

@Injectable({
    providedIn: 'root',
})
export class LocationService {   
    locationTypes = signal<LocationType[]>([]);
    countries = signal<Country[]>([]);

    constructor(private firestoreService: FirestoreService) {}

    async getDatas(){
        // on récupère les types de lieux et les pays une fois
        this.locationTypes.set(await this.firestoreService.getDocuments<LocationType[]>(FirebaseCollectionEnum.locationTypes));
        this.countries.set(await this.firestoreService.getDocuments<Country[]>(FirebaseCollectionEnum.country));
   }
}
