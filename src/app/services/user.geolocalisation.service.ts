import { Injectable, signal, Signal } from '@angular/core';
import { FirestoreService } from './firestore.services.common/firestore.service';
import { FirebaseCollectionEnum } from '../constants/firebaseCollectionEnum';
import { UserGeolocalisation } from '../models/UserGeolocalisation';
import { DocumentData, DocumentReference } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserGeolocalisationService {
  usersGeolocalisation = signal<UserGeolocalisation[]>([]);

  constructor(private firestoreService: FirestoreService) {}

  getAll(): Promise<UserGeolocalisation[]>{
    return this.firestoreService.getDocuments<UserGeolocalisation[]>(FirebaseCollectionEnum.UserGeolocalisation)
  }

  get(email: string, usersGeolocalisation: UserGeolocalisation[]): UserGeolocalisation | undefined{
    return usersGeolocalisation.find((user) => user.email == email);
  }

  async loadAll(){
    this.usersGeolocalisation.set(await this.getAll());
  }

  private getRef(id: string): DocumentReference<DocumentData, DocumentData>{
    return this.firestoreService.getDocumentRef(FirebaseCollectionEnum.UserGeolocalisation, id);
  }

  async update(id: string, userGeolocalisation: UserGeolocalisation): Promise<void>{
    const ref = this.getRef(id);

    await this.firestoreService.updateDocument(ref, userGeolocalisation);
  }
}
