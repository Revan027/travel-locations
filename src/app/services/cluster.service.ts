import { Injectable, Signal, signal } from '@angular/core';
import { FirestoreService } from './firestore.services.common/firestore.service';
import { Cluster, ClusterMap, ClusterRequest } from '../models/Cluster';
import { DocumentData, documentId, DocumentReference, query, QueryConstraint, where } from 'firebase/firestore';
import { FirebaseCollectionEnum } from '../constants/firebaseCollectionEnum';

@Injectable({
    providedIn: 'root',
})
export class ClusterService {   
    private _clusters = signal<ClusterMap[]>([]);
    clusters: Signal<ClusterMap[]> = this._clusters.asReadonly();

    private _cacheClusters = signal<ClusterMap[]>([]);
    cacheClusters: Signal<ClusterMap[]> = this._cacheClusters.asReadonly();
  
    constructor(private firestoreService: FirestoreService) {}
    
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

    async getAll(): Promise<Cluster[]>{
        return this.firestoreService.getDocuments<Cluster[]>(FirebaseCollectionEnum.Clusters);
    }

    getRef(id: string): DocumentReference<DocumentData, DocumentData>{
        return this.firestoreService.getDocumentRef(FirebaseCollectionEnum.Clusters, id);
    }

    get(id: string): Promise<Cluster>{
        return this.firestoreService.getDocument<Cluster>(FirebaseCollectionEnum.Clusters, id);
    }

    async getByIDs(clusterIDs: string[]){
        const length = clusterIDs.length;
        const chunk = 20;
        let results: string[] = [];   
        let start = 0;
        let end = 0;
    
        do{
            end += chunk;
            end = end > length ? length : end;
    
            results = results.concat(clusterIDs.slice(start, end));
            start = end;
        }while(start + 1 < length)

        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Clusters);


        return results.length == 0 ? [] : this.firestoreService.search<Cluster[]>(query(ref, where(documentId(), "in", results)))
    }

    async searchByCoord(latitude: number, longitude: number){
        let queryParts: QueryConstraint[] = [];
        const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Clusters);

        queryParts.push(where("maxLat", ">=", latitude));
        queryParts.push(where("maxLng", ">=", longitude));
        queryParts.push(where("minLat", "<=", latitude));
        queryParts.push(where("minLng", "<=", longitude));

        return this.firestoreService.search<Cluster[]>(query(ref, ...queryParts));  
    }


    setClusters(clusters: Cluster[]){
        this._clusters.set([...clusters] as ClusterMap[]);
    }

    setCacheClusters(clusters: Cluster[]){
        this._cacheClusters.set([...clusters] as ClusterMap[]);
    }
}
