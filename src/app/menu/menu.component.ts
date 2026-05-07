import { Component, OnInit } from '@angular/core';
import { App } from '@capacitor/app';

@Component({
    selector: 'app-menu',
    templateUrl: './menu.component.html',
    styleUrls: ['./menu.component.scss'],
    standalone: false,
})
export class MenuComponent implements OnInit{

    numVersion!: string;

    constructor() {}

    async ngOnInit() {
       const info = await App.getInfo();

       this.numVersion = info.version;
    }
}
