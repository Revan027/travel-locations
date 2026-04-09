# TravelLocations

Application mobile Ionic/Angular avec Capacitor.

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
