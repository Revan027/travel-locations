import { Component, signal } from '@angular/core';

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    standalone: false,
})
export class MenuComponent {
    activeCreation = signal<boolean>(false);

    constructor() {}
    
    onActiveCreation(){
        this.activeCreation.set(!this.activeCreation());

        // on ajoute un point au mileu de la carte 
        //ce point sera un point temporaire
        // on bascule ensite l'icone du boutton d'ajout en valider, pour valider le point.
        //On peut déplacer le point en drag an drop   <ion-icon name="pin-outline"></ion-icon>
    }
}
