import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuComponent } from './menu.component';
import { MenuRoutingModule } from './menu-routing.module';

@NgModule({
    imports: [IonicModule, CommonModule, RouterModule, MenuRoutingModule],
    declarations: [MenuComponent],
})
export class MenuModule {}
