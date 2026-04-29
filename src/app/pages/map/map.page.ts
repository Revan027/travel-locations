import { Component, OnInit, WritableSignal } from '@angular/core';
import { MapService } from 'src/app/services/map.service';
import { Position } from 'src/app/models/Position';
import { LocationService } from 'src/app/services/location.service';
import { Location } from 'src/app/models/Location';
import { FormBuilder, FormGroup } from '@angular/forms';
import { LocationType } from 'src/app/models/LocationType';
import { Country } from 'src/app/models/Country';
import moment from 'moment';
import { LocationSearchRequest } from 'src/app/models/LocationSearchRequest';

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
  standalone: false,
})
export class MapPage implements OnInit {

  position: WritableSignal<Position> = this.mapService.position;
  locations: WritableSignal<Location[]> = this.locationService.locations;
  locationsType: WritableSignal<LocationType[]> = this.locationService.locationTypes;
  countries: WritableSignal<Country[]> = this.locationService.countries;

  isRefreshing = false;
  formGroup!: FormGroup;

  constructor(
    private mapService: MapService, 
    private locationService: LocationService, 
    private formBuilder: FormBuilder)
  {
    moment.locale("fr");  
  }

  ngOnInit() {      
    this.createForm();
  }

  async ngAfterViewInit(){
    await this.locationService.getAll()
    await this.mapService.init();

    this.createForm();
  }

  async onRefreshPosition(){
    this.isRefreshing = true;

    await this.mapService.initCurrentPosition();
  
    await this.mapService.flyTo(this.position() as Position, 17);
    
    this.isRefreshing = false;
  }

  onActiveCreationLocation(){
    this.mapService.createNewLocationMarker();
  }

  async onSubmit(locationSearchRequest: LocationSearchRequest) {
    await this.locationService.search(locationSearchRequest);
  }

  private createForm() {
    this.formGroup = this.formBuilder.group({
      typeIDs: [this.locationService.locationSearchRequest()?.typeIDs],
      countryID: [this.locationService.locationSearchRequest()?.countryID],
      date: [this.locationService.locationSearchRequest()?.date ??  moment().format('YYYY-MM-DD')],
    });
  }
}
