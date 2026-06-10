import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Location } from 'src/app/models/Location';
import { LocationService } from 'src/app/services/location.service';
import { AuthStatusComponent } from 'src/app/components/auth-status.component';

@Component({
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, AuthStatusComponent],
  selector: 'app-locations',
  templateUrl: 'locations.page.html',
  styleUrls: ['locations.page.scss'],
})
export class LocationsPage {
 
  groupLocation: { [key: string]: Location[] } = {};  
  
  objectEntries = Object.entries; // convertie en objet en pair clé itérable

  constructor(private locationService: LocationService) {
    effect(() => {
      this.groupLocation = this.locationService.goupByType()
    });
  }
}
