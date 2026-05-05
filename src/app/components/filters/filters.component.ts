import { Component, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LocationService } from 'src/app/services/location.service';
import moment from 'moment';
import { LocationSearchRequest } from 'src/app/models/LocationSearchRequest';
import { LocationType } from 'src/app/models/LocationType';
import { Country } from 'src/app/models/Country';

@Component({
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule],
  selector: 'app-filters',
  templateUrl: 'filters.component.html',
  styleUrls: ['filters.component.scss']
})
export class FiltersComponent {

  formGroup!: FormGroup;

  locationsType: WritableSignal<LocationType[]> = this.locationService.locationTypes;
  countries: WritableSignal<Country[]> = this.locationService.countries;

  constructor(
    private locationService: LocationService, 
    private formBuilder: FormBuilder)
  {
    moment.locale("fr");  
  }

  async ngAfterViewInit(){
    this.createForm();
  }

  async onSubmit(locationSearchRequest: LocationSearchRequest) {
    this.locationService.locationSearchRequest.set(locationSearchRequest);

    await this.locationService.search(locationSearchRequest);
  }

  private createForm() {
    this.formGroup = this.formBuilder.group({
      typeIDs: [this.locationService.locationSearchRequest()?.typeIDs],
      country: [this.locationService.locationSearchRequest()?.country],
      date: [this.locationService.locationSearchRequest()?.date ?? moment().format('YYYY-MM-DD')],
    });
  }
}
