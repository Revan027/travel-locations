import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EditLocationPage } from './edit-location.page';
import { EditLocationPageRoutingModule } from './edit-location-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditLocationPageRoutingModule,
  ],
  declarations: [EditLocationPage],
})
export class EditLocationPageModule {}
