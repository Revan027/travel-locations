import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FirebaseError } from 'firebase/app';
import { UserCredential } from 'firebase/auth';
import { LoaderComponent } from 'src/app/components/loader.component';
import { MapService } from 'src/app/services/map.service';
import { AuthentificationService } from 'src/app/services/authentification.service';

@Component({
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, LoaderComponent],
  selector: 'app-sign-in',
  templateUrl: './sign-in.page.html',
  styleUrls: ['./sign-in.page.scss'],
})
export class SignInPage implements OnInit {

  loading: boolean = false;
  errorMsg: string = "";
  formGroup!: FormGroup;

  constructor(private formBuilder: FormBuilder, private location: Location, private authService: AuthentificationService, private mapService: MapService) { }

  ngOnInit() {
    this.createForm();
  }

  private createForm() {
    this.formGroup = this.formBuilder.group({
      email: ["", Validators.required],
      mdp: ["", Validators.required],
    });
  }

  async onSignIn(datas: any) {
    let userCredential!: UserCredential;
    this.loading = true;
    this.errorMsg = "";

    try {
      userCredential = await this.authService.signIn(datas.email, datas.mdp);
    } 
    catch(e: any) {
      let message = e as FirebaseError;

      if (message.code.includes("auth")){
        this.errorMsg = "Mauvais login/mot de passe";
      }
    } 
    finally{
      if (userCredential != undefined && !userCredential.user?.isAnonymous === true){
        // chargement du user dans l'app
        this.authService.loadUser(userCredential.user);

        // activation du géoloc sur la map
        this.mapService.locateUsers();

        this.cancel();
      }
      this.loading = false;
    }
  }

  cancel() {
    this.location.back();
  }
}
