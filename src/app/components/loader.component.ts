import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
    standalone: true,
    imports: [IonicModule],
    selector: 'app-loader',
    template: `
        <div class="loader-center">
            <ion-spinner name="dots"></ion-spinner>
        </div>
    `,
    styles: [`
        .loader-center {
            display: flex;
            justify-content: center;
            align-items: center;
        }
    `]
})
export class LoaderComponent {}
