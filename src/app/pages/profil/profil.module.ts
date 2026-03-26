import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ProfilPage } from './profil.page';
import { ProfilPageRoutingModule } from './profil-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfilPageRoutingModule,
  ],
  declarations: [ProfilPage],
})
export class ProfilPageModule {}
