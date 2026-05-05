import { Component, computed, effect, WritableSignal } from '@angular/core';
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
  groupLocation: { [key: string]: Location[] } = {};
  locationsType: WritableSignal<LocationType[]> = this.locationService.locationTypes;

  objectEntries = Object.entries;
  locations = effect(() => {
    this.locationService.locations().map((item: Location) => {
      if (this.groupLocation[item.typeID] == undefined){
        this.groupLocation[item.typeID] = []
      }
      this.groupLocation[item.typeID].push(item)
    }); 
    console.log(this.objectEntries(  this.groupLocation))

   return this.groupLocation; 
  });

  constructor(private locationService: LocationService) {

  }

  getLocationType(typeID: string){
    return this.locationsType().find((type) => type.id ==  typeID)?.name
  }
}
