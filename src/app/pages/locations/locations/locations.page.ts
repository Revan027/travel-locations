import { Component, effect } from '@angular/core';
import { Location } from 'src/app/models/Location';
import { LocationService } from 'src/app/services/location.service';

@Component({
  selector: 'app-locations',
  templateUrl: 'locations.page.html',
  styleUrls: ['locations.page.scss'],
  standalone: false,
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
