import { Component } from '@angular/core';

@Component({
    standalone: false,
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
