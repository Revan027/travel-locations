import { Injectable, Signal, signal } from '@angular/core';
import { FirestoreService } from './firestore.services.common/firestore.service';
import { Cluster, ClusterMap, ClusterRequest } from '../models/Cluster';
import { DocumentData, DocumentReference, query, QueryConstraint, where } from 'firebase/firestore';
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

    getRef(id: string): DocumentReference<DocumentData, DocumentData>{
        return this.firestoreService.getDocumentRef(FirebaseCollectionEnum.Clusters, id);
    }

    get(id: string): Promise<Cluster>{
        return this.firestoreService.getDocument<Cluster>(FirebaseCollectionEnum.Clusters, id);
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

    create(cluster: ClusterRequest){
        return this.firestoreService.createDocument(FirebaseCollectionEnum.Clusters, cluster);
    }

    async update(id: string, cluster: ClusterRequest): Promise<void>{
        const ref = this.getRef(id);

        await this.firestoreService.updateDocument(ref, cluster);
    }

    async delete(id: string){
        const ref = this.getRef(id);

        return this.firestoreService.deleteDocument(ref);
    }

    loadClusters(clusters: Cluster[]){
        this._clusters.set({...clusters} as ClusterMap[]);
    }
}
