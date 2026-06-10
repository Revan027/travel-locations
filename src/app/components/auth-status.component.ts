import { Component, WritableSignal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FirestoreService } from '../services/firestore.services.common/firestore.service';
import { User } from '../models/User';
import { Router } from '@angular/router';

@Component({
    standalone: true,
    imports: [IonicModule],
    selector: 'app-auth-status',
    template: `
        @if (user().isAuthenticated){
            <ion-grid>
                <ion-row class="ion-align-items-center">
                    <ion-col>
                        <ion-icon name="person-circle-outline"></ion-icon>
                    </ion-col>

                    <ion-col>
                        {{user().getDisplayName()}}
                    </ion-col>

                    <ion-col>
                        <ion-button class="btn-logout" fill="clear" (click)="signOut()">
                            <ion-icon slot="icon-only" color="primary" name="log-out-outline"></ion-icon>
                        </ion-button>
                    </ion-col>
                </ion-row>
            </ion-grid>
        }
        @else{
            <ion-button class="btn-logout" fill="clear" (click)="signIn()">
                <ion-icon slot="icon-only" color="primary" name="log-in-outline"></ion-icon>
            </ion-button>
        }
    `,
    styles: [`
        ion-grid{
            --ion-grid-padding: 0;
        }

        ion-col{
           --ion-grid-column-padding: 2px;
            font-size: var(--ion-font-size-sm);
        }

        ion-icon{
           font-size: 26px;
        }
    `]
})
export class AuthStatusComponent {
    user: WritableSignal<User> = this.firestoreService.user;

    constructor(private router: Router, private firestoreService: FirestoreService)
    {
    }

    signOut(){
        this.router.navigateByUrl(`/signout`);
    }

    signIn(){
        this.router.navigateByUrl(`/signin`);
    }
}
