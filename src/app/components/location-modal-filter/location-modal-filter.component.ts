import { Component, output, Signal} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { LocationService } from 'src/app/services/location.service';
import { LocationFilterComponent } from '../location-filter/location-filter.component';
import { LocationFilter } from 'src/app/models/LocationFilter';
import { LocationSearchRequest } from 'src/app/models/LocationSearchRequest';
import { Timestamp } from 'firebase/firestore';
import moment from 'moment';

@Component({
  standalone: true,
  imports: [IonicModule, LocationFilterComponent],
  selector: 'app-location-modal-filter',
  templateUrl: 'location-modal-filter.component.html',
  styleUrls: ['location-modal-filter.component.scss']
})
export class LocationModalFilterComponent{

  filterChanged = output<boolean>();
  locationSearchRequest: Signal<LocationSearchRequest>;

  constructor(private locationService: LocationService){
    moment.locale("fr"); 

    this.locationSearchRequest = this.locationService.locationSearchRequest;
  }

  async onFilterChanged(locationFilter: LocationFilter){
    let locationSearchRequest: LocationSearchRequest = new LocationSearchRequest();
        if(locationFilter?.date){
          locationSearchRequest.beginDate = Timestamp.fromDate(moment(locationFilter?.date).toDate());
          locationSearchRequest.endDate = Timestamp.fromDate(moment(locationFilter?.date).add(1, "years").add(-1, "days").toDate());
           locationSearchRequest.year = locationFilter?.date;   
        }
       
    locationSearchRequest.typeIDs = locationFilter?.typeIDs;

    this.locationService.setLocationSearchRequest(locationSearchRequest);

    this.filterChanged.emit(true);
  }
}

