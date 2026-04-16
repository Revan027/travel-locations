# TravelLocations

Application mobile Ionic/Angular/Capacitor pour gérer et visualiser des lieux sur une carte interactive.

## Fonctionnalités

- **Carte interactive** : Visualisation des lieux enregistrés avec Leaflet
- **Localisation** : Position GPS en temps réel
- **Lieux** : Création, modification et suppression de lieux
- **Synchronisation** : Données stockées sur Firestore

## Stack technique

| Technologie | Version |
|---|---|
| Angular | 20 |
| Ionic | 8 |
| Capacitor | 8 |
| TypeScript | 5.9 |
| Leaflet | — |
| Firebase / Firestore | — |

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
