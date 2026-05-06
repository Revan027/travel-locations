import { Component, effect, WritableSignal } from '@angular/core';
import { Location } from 'src/app/models/Location';
import { LocationType } from 'src/app/models/LocationType';
import { LocationService } from 'src/app/services/location.service';

@Component({
  selector: 'app-locations',
  templateUrl: 'locations.page.html',
  styleUrls: ['locations.page.scss'],
  standalone: false,
})
export class LocationsPage {
 
  locationsType: WritableSignal<LocationType[]> = this.locationService.locationTypes;
  groupLocation: { [key: string]: Location[] } = {};  
  
  objectEntries = Object.entries; // convertie en objet en pair clé itérable

  constructor(private locationService: LocationService) {
    effect(() => {
      this.groupLocation = this.locationService.goupByType()
    });
  }

  getLocationType(typeID: string){
    return this.locationsType().find((type) => type.id ==  typeID)?.name
  }
}
