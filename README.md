# TravelLocations

Application mobile de gestion et visualisation de lieux géographiques visités ou à visiter, développée avec Ionic/Angular et déployée sur Android via Capacitor.

## Stack technique

| Technologie | Version |
|---|---|
| Angular | 20 |
| Ionic | 8 |
| Capacitor | 8 |
| TypeScript | 5.9 |
| Firebase / Firestore | 11 |
| Leaflet | 1.9 |
| Capacitor Geolocation | 8 |
| Moment.js | 2.30 |
| Material Icons | — |
| Nunito (police) | — |

## Fonctionnalités

### Carte (MapPage)
- Affichage Leaflet centré sur la France au démarrage
- Géolocalisation de l'utilisateur avec marqueur dédié et rafraîchissement manuel
- Double-clic pour zoomer sur une zone
- **Clusters** : regroupement automatique des lieux proches (tolérance 2°), affichés sous forme de cercles avec compteur en dessous du zoom 8
- Au-delà du zoom 8 : affichage des marqueurs individuels dans les limites visibles uniquement (optimisation)
- Création d'un nouveau lieu via un marqueur draggable positionné au centre de la carte
- Popup de prévisualisation au clic sur un marqueur (nom, date, coordonnées, altitude)

### Lieux (LocationsPage)
- Liste des lieux groupés par type
- Filtres par type, pays et date via le composant `FiltersComponent`
- Recherche Firestore avec contraintes dynamiques

### Édition d'un lieu (EditLocationPage)
- Création à partir des coordonnées du marqueur placé sur la carte
- Récupération automatique de l'altitude via l'**API Open Elevation**
- Modification et suppression avec confirmation
- Formulaire réactif : nom, altitude, coordonnées, type, pays, date

## Architecture

```
src/app/
├── pages/
│   ├── map/                    # Page carte principale
│   ├── locations/
│   │   ├── locations/          # Liste des lieux groupés par type
│   │   └── edit-location/      # Création / édition / suppression
│   └── profil/
├── services/
│   ├── map.service.ts          # Leaflet, clusters, marqueurs, géolocalisation, altitude
│   ├── location.service.ts     # CRUD Firestore, recherche, groupement par type
│   └── services.common/        # HTTP, Toast, Confirmation, Error
├── models/                     # Location, LocationType, Country, Cluster, Position
├── components/
│   ├── filters.component.ts    # Filtres de recherche (standalone)
│   └── loader.component.ts
└── constants/
    └── firebaseCollectionEnum.ts
```

## Installation

### 1. Cloner le repo

```bash
git clone https://github.com/Revan027/TravelLocations.git
cd TravelLocations
```

### 2. Installer Ionic CLI (si pas déjà installé)

```bash
npm install -g @ionic/cli
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Configurer les environnements

Copier les fichiers d'exemple et renseigner ta config Firebase :

```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
```

### 5. Ajouter les services communs

Cloner le repo des services communs dans le bon dossier :

```bash
git clone https://github.com/Revan027/services.common.git src/app/services/services.common
```

## Lancer en développement web

```bash
ionic serve
```

## Lancer sur Android depuis Android Studio

Comme c'est un projet Ionic/Angular + Capacitor, les assets web doivent être compilés avant chaque build Android. Voici comment configurer Android Studio pour le faire automatiquement.

### 1. Ouvrir le projet Android

Dans Android Studio : `File > Open` → sélectionner le dossier `android/` du projet.

### 2. Configurer les External Tools

`File > Settings` (ou `Ctrl + Alt + S`) → `Tools > External Tools` → cliquer sur `+`

Créer deux outils :

**Outil 1 — Build Ionic**
| Champ | Valeur |
|---|---|
| Name | `Build Ionic` |
| Program | `cmd` |
| Arguments | `/c npm run build` |
| Working directory | `C:\Users\morga\ProjetPerso\TravelLocations` |

**Outil 2 — Cap Copy Android**
| Champ | Valeur |
|---|---|
| Name | `Cap Copy Android` |
| Program | `cmd` |
| Arguments | `/c npx cap copy android` |
| Working directory | `C:\Users\morga\ProjetPerso\TravelLocations` |

### 3. Ajouter dans la Run Configuration

`Run > Edit Configurations` → sélectionner la config `app` → section **Before Launch** → cliquer sur `+` → `Run External Tool` → sélectionner `Build Ionic` puis `Cap Copy Android`.

---

Après cette configuration, chaque clic sur **Run** ou **Build** dans Android Studio compile automatiquement l'app Angular et copie les assets avant de lancer le build Android.
