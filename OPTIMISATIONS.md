# Rapport de performance — TravelLocations

> Dernière mise à jour : 15/10/2026 — branche `feature/filtre-map`

## Sommaire

1. [Résumé](#1-résumé)
2. [Consommation Firestore estimée](#2-consommation-firestore-estimée)
3. [Déjà fait](#3-déjà-fait)
4. [À faire — impact fort](#4-à-faire--impact-fort)
5. [À faire — impact moyen](#5-à-faire--impact-moyen)
6. [À faire — impact faible](#6-à-faire--impact-faible)
7. [Bugs repérés en chemin](#7-bugs-repérés-en-chemin)
8. [Rappels Firestore](#8-rappels-firestore)

---

## 1. Résumé

Pour un usage à 2 personnes, occasionnel, **les perfs et les coûts sont OK** : on est à ~1 à 6 % du quota gratuit journalier.

Les optimisations listées ici servent surtout à **tenir la montée en volume** (plus de lieux, plus de clusters) et à **éviter des plantages** (limite des 30 valeurs dans `in`).

**Priorités :**

| # | Sujet | Gain | Effort |
|---|---|---|---|
| 1 | `refreshMap` : comptage par cluster au lieu de lire toutes les locations | Lectures ÷ 10 à ÷ 100 + compteurs justes | Moyen |
| 2 | `refreshMap` : ne pas recharger tous les clusters à chaque filtre | − 1 lecture par cluster par filtre | Faible |
| 3 | Découper les `in` en lots de 30 | Évite un crash | Faible |
| 4 | `increment()` pour `countLocation` | − 1 requête + compteur fiable | Faible |

---

## 2. Consommation Firestore estimée

Hypothèses : quelques centaines de lieux, 20 à 50 clusters, 2 utilisateurs, 1 à 3 ouvertures par jour chacun.

### Au démarrage (`AppInitService`) — ~100 à 300 lectures

| Requête | Coût |
|---|---|
| Tous les clusters (`clusterService.getAll`) | 1 lecture / cluster (~20–50) |
| Tous les pays | 1 lecture / pays (~200 si tous les pays du monde) ⚠️ poste le plus lourd |
| Types de lieux | ~10–20 |
| Positions utilisateurs | 2 |
| Dates min / max | 2 |

### Pendant l'utilisation — ~50 à 300 lectures / session

| Action | Coût |
|---|---|
| Changement de filtre sur la carte | 1 lecture / cluster **+** 1 lecture / lieu filtré |
| Zoom ≥ 8 sur une zone | 1 lecture / lieu des clusters visibles (1re fois seulement) |
| Liste : compteur | 1 lecture (par tranche de 1 000) |
| Liste : chaque page | 1 lecture / lieu + 1 lecture (`getDoc` du dernier élément) |

### Total

**~500 à 3 000 lectures / jour** pour 50 000 gratuites. Écritures négligeables.

Pour dépasser le quota il faudrait ~100 sessions / jour ou plusieurs milliers de lieux.

> Vérifier les vrais chiffres : console Firebase → Firestore → onglet **Utilisation**.

---

## 3. Déjà fait

- [x] **Clusters filtrés depuis un cache** au lieu d'une requête `documentId() in [...]` (`map.service.ts` → `refreshMap`).
- [x] **`setClusters` renvoie un vrai tableau** : `[...clusters]` au lieu de `{...clusters}` (`cluster.service.ts`).
- [x] **Signaux inutiles supprimés** : `LocationsPage.locationSearchRequest` et `MapService.isMapInit` sont redevenus des propriétés simples.
- [x] **Dates min / max en parallèle** avec `Promise.all` (`location.service.ts` → `getAvailableDates`).

---

## 4. À faire — impact fort

### 4.1 `refreshMap` lit toutes les locations filtrées

📍 `map.service.ts` → `refreshMap` · `location.service.ts` → `searchCluster`

**Problème :** à chaque changement de filtre, `searchCluster` lit **tous** les documents `Locations` correspondants (1 lecture chacun) pour n'en garder que le `clusterID`. Avec 2 000 lieux sur l'année → 2 000 lectures par clic.

Autre conséquence : le chiffre affiché sur chaque cluster vient de `countLocation` (total **sans** filtre). Il est faux dès qu'un filtre est actif.

**Solution :** un `getCountFromServer` par cluster, en parallèle. Coût : ~1 lecture par cluster, quel que soit le nombre de lieux.

```ts
// location.service.ts
async countByCluster(clusters: Cluster[], locationSearchRequest: LocationSearchRequest){
    const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);

    return Promise.all(clusters.map(async (cluster) => {
        const queryParts = this.getQuerySearch(locationSearchRequest);
        queryParts.push(where("clusterID", "==", cluster.id));

        const snapshot = await getCountFromServer(query(ref, ...queryParts));

        return { ...cluster, countLocation: snapshot.data().count };
    }));
}
```

```ts
// map.service.ts
async refreshMap(){
    const clusters = await this.locationService.countByCluster(
        this.clusterService.cacheClusters(),
        this.locationService.locationSearchRequest()
    );

    this.clusterService.setClusters(clusters.filter(x => x.countLocation > 0));
    // ...
}
```

> Firestore demandera probablement un **index composite** (`clusterID` + `date` + `typeID`). Le message d'erreur contient un lien qui le crée directement.

### 4.2 `refreshMap` recharge tous les clusters à chaque filtre

📍 `map.service.ts` → `refreshMap` (1re ligne)

**Problème :** `setCacheClusters(await this.clusterService.getAll())` relit tous les clusters à chaque changement de filtre, alors qu'ils ne changent qu'à l'ajout ou la suppression d'un lieu.

**Solution :** ne recharger le cache que là où il change.

- Dans `LocationService.create` : ajouter le nouveau cluster au cache (ou mettre à jour son `countLocation`).
- Dans `LocationService.delete` : retirer le cluster supprimé du cache.
- Ou plus simple : recharger le cache uniquement depuis `EditLocationPage.onSubmit` / `onDelete`, pas dans `refreshMap`.

Au passage, si on garde les deux appels, les lancer en parallèle :

```ts
const [clusters, clusterIDs] = await Promise.all([
    this.clusterService.getAll(),
    this.locationService.searchCluster(this.locationService.locationSearchRequest()),
]);
```

### 4.3 Limite des 30 valeurs dans `in`

Firestore refuse un `in` avec plus de 30 valeurs → **la requête plante**.

| Endroit | Risque |
|---|---|
| `location.service.ts` → `searchByClusters` | Réel : 30+ clusters visibles au zoom 8 sur tablette |
| `location.service.ts` → `getCountLocations` | Nul aujourd'hui (appelé avec 1 cluster) |
| `location.service.ts` → `getQuerySearch` (`typeID in`) | Nul tant qu'il y a < 30 types |

**Solution :** découper en lots et lancer en parallèle.

```ts
async searchByClusters(clusters: Cluster[], locationSearchRequest: LocationSearchRequest){
    const ref = this.firestoreService.getCollectionRef(FirebaseCollectionEnum.Locations);
    const chunk = 30;
    const requests: Promise<Location[]>[] = [];

    for (let start = 0; start < clusters.length; start += chunk) {
        const ids = clusters.slice(start, start + chunk).map(x => x.id);
        const queryParts = this.getQuerySearch(locationSearchRequest);
        queryParts.push(where("clusterID", "in", ids));

        requests.push(this.firestoreService.search<Location[]>(query(ref, ...queryParts)));
    }

    return (await Promise.all(requests)).flat();
}
```

---

## 5. À faire — impact moyen

### 5.1 Compteur de cluster avec `increment()`

📍 `location.service.ts` → `create` et `delete`

**Problème :** on fait un `getCountFromServer` puis un `update` avec la valeur calculée. Ça coûte une requête en plus, et si deux ajouts arrivent en même temps, l'un des deux est perdu (les deux lisent 5, les deux écrivent 6).

**Solution :** écriture **atomique** — c'est le serveur qui fait l'addition.

```ts
import { increment } from 'firebase/firestore';

updateDoc(clusterRef, { countLocation: increment(1) });   // create
updateDoc(clusterRef, { countLocation: increment(-1) });  // delete
```

### 5.2 Requêtes en double sur `moveend`

📍 `map.service.ts` → `updateMapDisplay`

**Problème :** fonction async, rien n'empêche deux appels de se chevaucher. Un déplacement rapide peut interroger deux fois les mêmes clusters avant que `locationMarkers` soit renseigné.

**Solution :** marquer les clusters « en chargement » avant l'`await`, ou ignorer l'appel si un chargement est en cours.

### 5.3 Pagination : `getDoc` en trop

📍 `location.service.ts` → `getNextPage`

**Problème :** à partir de la page 2, `getDoc(lastID)` pour retrouver le document de départ → 1 lecture de plus par page.

**Solution :** garder le dernier `DocumentSnapshot` de la page précédente et le passer à `startAfter`. Nécessite que `FirestoreService.search` puisse renvoyer les snapshots.

### 5.4 `loadDatas` séquentiel

📍 `location.service.ts` → `loadDatas`

**Problème :** 3 `await` à la suite alors que les appels sont indépendants → démarrage plus lent.

**Solution :**

```ts
async loadDatas(): Promise<void>{
    const [, types, countries] = await Promise.all([
        this.loadAvailableDates(),
        this.firestoreService.getDocuments<LocationType[]>(FirebaseCollectionEnum.LocationTypes),
        this.firestoreService.getDocuments<Country[]>(FirebaseCollectionEnum.Country),
    ]);

    this.setLocationTypes(types);
    this.setCountries(countries);
}
```

### 5.5 Pays chargés à chaque démarrage

📍 `location.service.ts` → `loadDatas`

**Problème :** ~200 lectures à chaque ouverture pour une liste qui ne change jamais.

**Pistes :** mettre la liste en dur dans l'app (fichier `.ts` / `.json`), ou la mettre en cache local (`StorageService` Capacitor) et ne la recharger que rarement.

---

## 6. À faire — impact faible

| Sujet | Où | Solution |
|---|---|---|
| Images de la liste sans lazy loading | `locations.page.html` | `<img loading="lazy" ...>` |
| HTML des popups construit pour chaque marker | `marker-factory.service.ts` → `buildLocationMarker` | `bindPopup(() => html)` : construit à l'ouverture seulement |
| `getBounds()` appelé 2× par cluster, 2 parcours | `map.service.ts` → `updateMapDisplay` | Une seule boucle qui remplit `visibleClusters` et `invisibleClusters` |
| `Object.values(this.clusters())` devenu inutile | `map.service.ts` → `updateMapDisplay` | `this.clusters().filter(...)` directement |
| `clusterIDs.includes` dans un `filter` | `map.service.ts` → `refreshMap` | `const ids = new Set(clusterIDs)` puis `ids.has(x.id)` |
| Tuiles chargées pendant le déplacement | `map.service.ts` → `createMap` (`updateWhenIdle: false`) | Laisser la valeur par défaut sur mobile (`true`) |
| Code mort | `cluster.service.ts` → `getByIDs` + import `documentId` | Supprimer |
| `console.log` oublié | `authentification.service.ts` | Supprimer |

---

## 7. Bugs repérés en chemin

Pas de la perf, mais à corriger.

### Signaux mutés en place

Un signal compare par **référence**. Modifier l'objet / le tableau puis le redonner au signal = même référence → aucune notification. Ça marche aujourd'hui uniquement parce que zone.js relance la détection de changements après chaque clic. En `OnPush` ou zoneless, l'écran ne se mettra plus à jour.

| Où | Correction |
|---|---|
| `location.service.ts` → `setLocationDates` (`push` puis `set`) | Construire le tableau complet puis `set` une seule fois, ou `update(ids => [...ids, value])` |
| `location-filter.component.ts` → `setLocationTypeIDs`, `removeLocationTypeIDs`, `resetLocationTypeIDs`, `updateLocationDate` | `update(item => ({ ...item, typeIDs: ids }))` |

### Divers

- `location.service.ts` → `create` : le commentaire dit « on prend le plus petit » mais le tri est **décroissant** (`? 1 : -1`) → on prend le cluster qui a le **plus** de lieux.
- `location.service.ts` → `delete` : `await this.clusterService.getRef(...)` — `getRef` n'est pas async, l'`await` est inutile.

---

## 8. Rappels Firestore

### Quotas gratuits (identiques Spark et Blaze)

| | Par jour | ≈ par mois |
|---|---|---|
| Lectures | 50 000 | ~1,5 million |
| Écritures | 20 000 | ~600 000 |
| Suppressions | 20 000 | ~600 000 |
| Stockage | 1 Go total | |

- Remise à zéro à **minuit heure du Pacifique** (9 h en France l'été, 8 h l'hiver).
- **Spark** : requêtes refusées une fois la limite atteinte.
- **Blaze** : paiement à l'usage au-delà (quelques centimes / 100 000 lectures selon la région).

### Ce qui coûte quoi

| Opération | Coût |
|---|---|
| `getDoc` / document renvoyé par `getDocs` | 1 lecture par document |
| Requête qui ne renvoie rien | 1 lecture minimum |
| `getCountFromServer` | 1 lecture par tranche de 1 000 documents comptés |
| `addDoc` / `updateDoc` / `setDoc` | 1 écriture |
| `deleteDoc` | 1 suppression |

### Limites à connaître

- `in` / `not-in` / `array-contains-any` : **30 valeurs max**.
- Un `in` avec un tableau **vide** lève une erreur → tester `length` avant.
- `where(documentId(), "in", ids)` : requêter sur l'ID d'un document qui n'a pas de champ `id`.
