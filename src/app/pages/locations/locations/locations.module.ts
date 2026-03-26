import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { LocationsPage } from './locations.page';
import { LocationsPageRoutingModule } from './locations-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LocationsPageRoutingModule,
  ],
  declarations: [LocationsPage],
})
export class LocationsPageModule {}
