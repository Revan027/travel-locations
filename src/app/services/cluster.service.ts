import { Injectable, Signal, signal } from '@angular/core';
import { FirestoreService } from './firestore.services.common/firestore.service';
import { Cluster, ClusterMap } from '../models/Cluster';
import { query, QueryConstraint, where } from 'firebase/firestore';
import { FirebaseCollectionEnum } from '../constants/firebaseCollectionEnum';

@Injectable({
    providedIn: 'root',
})
export class ClusterService {   
    private _clusters = signal<ClusterMap[]>([]);
    clusters: Signal<ClusterMap[]> = this._clusters.asReadonly();
  
    constructor(private firestoreService: FirestoreService) {}

    async getAll(): Promise<Cluster[]>{
        return this.firestoreService.getDocuments<Cluster[]>(FirebaseCollectionEnum.Clusters);
    }

    async search(latitude: number, longitude: number){
        let queryParts: QueryConstraint[] = [];
        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Clusters);

        queryParts.push(where("maxLat", ">=", latitude));
        queryParts.push(where("maxLng", ">=", longitude));
        queryParts.push(where("minLat", "<=", latitude));
        queryParts.push(where("minLng", "<=", longitude));

        return this.firestoreService.search<Cluster[]>(query(ref, ...queryParts));  
    }

    loadClusters(clusters: Cluster[]){
        this._clusters.set({...clusters} as ClusterMap[]);
    }
}
