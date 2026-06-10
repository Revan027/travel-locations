import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.morgan.travellocations',
  appName: 'TravelLocations',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,        // on cache le splash nous-mêmes, après l'init
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#f4a261',        // --ion-color-primary
      androidSpinnerStyle: 'large',   // gros spinner circulaire (alternative : 'horizontal' = barre de progression)
    },
  },
};

export default config;
