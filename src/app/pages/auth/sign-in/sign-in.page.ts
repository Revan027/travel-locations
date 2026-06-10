import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FirebaseError } from 'firebase/app';
import { UserCredential } from 'firebase/auth';
import { FirestoreService } from 'src/app/services/firestore.services.common/firestore.service';
import { LoaderComponent } from 'src/app/components/loader.component';

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

  constructor(private formBuilder: FormBuilder, private location: Location, private firestoreService: FirestoreService) { }

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
      userCredential = await this.firestoreService.signIn(datas.email, datas.mdp);
    } 
    catch(e: any) {
      let message = e as FirebaseError;

      if (message.code.includes("auth")){
        this.errorMsg = "Mauvais login/mot de passe";
      }
    } 
    finally{
      if (userCredential != undefined && !userCredential.user?.isAnonymous === true){
        this.firestoreService.createUser(userCredential.user);

        this.cancel();
      }
      this.loading = false;
    }
  }

  cancel() {
    this.location.back();
  }
}
