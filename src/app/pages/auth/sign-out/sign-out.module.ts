import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SignOutPageRoutingModule } from './sign-out-routing.module';

import { SignOutPage } from './sign-out.page';
import { AuthStatusComponent } from 'src/app/components/auth-status.component';
import { LoaderComponent } from 'src/app/components/loader.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SignOutPageRoutingModule,
    AuthStatusComponent,
    LoaderComponent
  ],
  declarations: [SignOutPage]
})
export class SignOutPageModule {}
