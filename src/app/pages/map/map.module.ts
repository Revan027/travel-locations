import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MapPage } from './map.page';
import { MapPageRoutingModule } from './map-routing.module';
import { LoaderComponent } from 'src/app/components/loader.component';
import { FiltersComponent } from 'src/app/components/filters/filters.component';
import { AuthStatusComponent } from 'src/app/components/auth-status.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MapPageRoutingModule,
    LoaderComponent,
    FiltersComponent,
    AuthStatusComponent
  ],
  declarations: [MapPage],
})
export class MapPageModule {}
