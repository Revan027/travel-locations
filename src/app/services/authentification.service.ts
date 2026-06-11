import { Injectable, signal, WritableSignal } from '@angular/core';
import { User } from '../models/User';
import { Auth, signInAnonymously } from '@angular/fire/auth';
import { signInWithEmailAndPassword, UserCredential, User as AuthUser } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthentificationService {
  user: WritableSignal<User> = signal(new User());

  constructor(private auth: Auth) {
  }

  async intUser(){
    //on commence par attendre que l'auth firebase soit faites
    await this.auth.authStateReady();

    if (!this.auth.currentUser || this.auth.currentUser?.isAnonymous){ // si pas user firestore trouvé ou non connecté
      this.signInAnonymously();
    }
    else{
      this.loadUser(this.auth.currentUser)
    }
    /* 
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log("user : ", user);
        // ...
      } 
      else {
        signInAnonymously(this.auth)
      }
    });*/
  }

  signIn(email: string, mdp: string): Promise<UserCredential>{
    return signInWithEmailAndPassword(this.auth, email, mdp);
  }

  async signInAnonymously(): Promise<void>{
    await signInAnonymously(this.auth);

    this.user.set(new User());
  }

  async loadUser(authUser: AuthUser): Promise<void>{
    const user = new User();
    user.isAuthenticated = !authUser.isAnonymous;
    user.email = authUser.email || "";

    this.user.set(user);
  } 
}
