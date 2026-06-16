import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { bootstrapApplication } from '@angular/platform-browser';
import { LoadingPage } from './app/pages/loading/loading.page';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

//bootstrapApplication(LoadingPage);  // uniquement composant stand alone