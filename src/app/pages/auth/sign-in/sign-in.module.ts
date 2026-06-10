import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SignInPageRoutingModule } from './sign-in-routing.module';

import { SignInPage } from './sign-in.page';
import { AuthStatusComponent } from 'src/app/components/auth-status.component';
import { LoaderComponent } from 'src/app/components/loader.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SignInPageRoutingModule,
    AuthStatusComponent,
    LoaderComponent,
    ReactiveFormsModule
  ],
  declarations: [SignInPage]
})
export class SignInPageModule {}
