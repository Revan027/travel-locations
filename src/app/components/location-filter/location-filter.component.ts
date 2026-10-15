import { Component, input, OnInit, output, signal, Signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import moment from 'moment';
import { LocationFilter } from 'src/app/models/LocationFilter';
import { LocationType } from 'src/app/models/LocationType';
import { LocationService } from 'src/app/services/location.service';

@Component({ 
  standalone: true,
  imports: [IonicModule],
  selector: 'app-location-filter',
  templateUrl: './location-filter.component.html',
  styleUrls: ['./location-filter.component.scss'],
})
export class LocationFilterComponent  implements OnInit {

  protected locationTypes: Signal<LocationType[]>;
  protected locationDates: Signal<string[]>;

  hasFirstEmit = input<boolean>(false);
  showAllDate = input<boolean>(false);
  typeIDs = input<string[]>([]);
  date = input<string>('');

  filterChanged = output<LocationFilter>();

  locationFilter = signal<LocationFilter>(new LocationFilter());

  constructor(private locationService: LocationService) {
    moment.locale("fr"); 

    this.locationTypes = this.locationService.locationTypes;
    this.locationDates = this.locationService.locationDates;
  }

  ngOnInit() {   
    this.locationFilter.set(
      new LocationFilter(
        this.showAllDate() ? this.date() : moment().format("YYYY"), 
        this.typeIDs())
      );
    
    if(this.hasFirstEmit())
      this.filterChanged.emit(this.locationFilter());
  }

  onDateChanged(year: string = ""){
    this.updateLocationDate(year); 

    this.filterChanged.emit(this.locationFilter())
  }

  onTypeChanged(id: string = ""){
    if(!id){
      this.resetLocationTypeIDs();
    }
    else if(this.locationFilter().typeIDs?.includes(id)){
      this.removeLocationTypeIDs(id);
    }
    else{
      this.setLocationTypeIDs(id);
    }

    this.filterChanged.emit(this.locationFilter())
  } 

  private setLocationTypeIDs(value: string){
    let ids = this.locationFilter().typeIDs;
    ids = ids ?? [];
    ids?.push(value);

    this.locationFilter.update((item: LocationFilter) => {item.typeIDs = ids; return item;});    
  }

  private removeLocationTypeIDs(value: string){
    let ids = this.locationFilter().typeIDs;

    this.locationFilter.update((item: LocationFilter) => {item.typeIDs = ids?.filter(x => x != value); return item;});    
  }

  private resetLocationTypeIDs(){
   this.locationFilter.update((item: LocationFilter) => {item.typeIDs = []; return item;});       
  }

  private updateLocationDate(value: string){
   this.locationFilter.update((item: LocationFilter) => {item.date = value; return item;});    
  } 
}
