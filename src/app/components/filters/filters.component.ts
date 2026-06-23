import { Component, computed, OnInit, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LocationService } from 'src/app/services/location.service';
import moment from 'moment';
import { LocationSearchRequest } from 'src/app/models/LocationSearchRequest';
import { LoaderComponent } from '../loader.component';
import { DatetimeComponent } from '../datetime/datetime.component';

@Component({
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, LoaderComponent, DatetimeComponent],
  selector: 'app-filters',
  templateUrl: 'filters.component.html',
  styleUrls: ['filters.component.scss']
})
export class FiltersComponent{

  locationSearchRequest: WritableSignal<LocationSearchRequest> = this.locationService.locationSearchRequest;
  loaded: boolean = false; 
  formGroup!: FormGroup;

  sortedLocationsType = computed(() => this.locationService.locationTypes().sort((a, b) => a.name.trim().localeCompare(b.name.trim(), "fr", { sensitivity: "base" })));
  sortedCountries = computed(() => this.locationService.countries().sort((a, b) => a.name.trim().localeCompare(b.name.trim(), "fr", { sensitivity: "base" })));

  constructor(
    private locationService: LocationService, 
    private formBuilder: FormBuilder){
      moment.locale("fr");  
    }

  ngAfterViewInit() {
    this.createForm();
    this.loaded = true;
  }

  async onSubmit(locationSearchRequest: LocationSearchRequest) {
    this.locationService.locationSearchRequest.set(locationSearchRequest);

    await this.locationService.search(locationSearchRequest);
  }

  async onReset() {
    this.locationService.locationSearchRequest.set(new LocationSearchRequest());
    this.createForm();
    await this.locationService.search(this.locationService.locationSearchRequest());
  }

   onDateChanged(event: any){
    this.formGroup.get("limitDate")?.setValue(event);
  }

  private createForm() {
    this.formGroup = this.formBuilder.group({
      typeIDs: [this.locationService.locationSearchRequest()?.typeIDs],
      country: [this.locationService.locationSearchRequest()?.country],
      limitDate: [this.locationService.locationSearchRequest()?.limitDate ?? moment().format('YYYY-MM-DD')],
    });
  }
}
