import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FirestoreService } from 'src/app/services/firestore.services.common/firestore.service';
import { LoaderComponent } from 'src/app/components/loader.component';

@Component({
  standalone: true,
  imports: [IonicModule, LoaderComponent],
  selector: 'app-sign-out',
  templateUrl: './sign-out.page.html',
  styleUrls: ['./sign-out.page.scss'],
})
export class SignOutPage implements OnInit {

  loading: boolean = false;

  constructor(private location: Location, private firestoreService: FirestoreService) { }

  ngOnInit() {
  }

  async onSignOut() {
    this.loading = true;

    try {
      await this.firestoreService.signInAnonymously();
    } 
    finally {
      this.cancel();

      this.loading = false;
    } 
  }

  cancel() {
    this.location.back();
  }
}
