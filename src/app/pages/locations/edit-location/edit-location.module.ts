import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditLocationPage } from './edit-location.page';
import { EditLocationPageRoutingModule } from './edit-location-routing.module';
import { LoaderComponent } from 'src/app/components/loader.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    LoaderComponent,
    EditLocationPageRoutingModule,
  ],
  declarations: [EditLocationPage],
})
export class EditLocationPageModule {}
