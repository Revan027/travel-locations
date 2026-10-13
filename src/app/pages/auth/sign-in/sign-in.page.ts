import { Location } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
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

  protected loading = signal<boolean>(false);
  protected errorMsg = signal<string>("");
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
    this.setLoading(true);
     this.setErrorMsg("");

    try {
      userCredential = await this.authService.signIn(datas.email, datas.mdp);
    } 
    catch(e: any) {
      let message = e as FirebaseError;

      if (message.code.includes("auth")){
        this.setErrorMsg("Mauvais login/mot de passe");
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
      this.setLoading(false);
    }
  }

  cancel() {
    this.location.back();
  }

  private setLoading(value: boolean){
    this.loading.set(value)
  }

  private setErrorMsg(value: string){
    this.errorMsg.set(value)
  }
}
