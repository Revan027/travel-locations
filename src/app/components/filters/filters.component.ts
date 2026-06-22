import { Component, computed, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LocationService } from 'src/app/services/location.service';
import moment from 'moment';
import { LocationSearchRequest } from 'src/app/models/LocationSearchRequest';
import { LoaderComponent } from '../loader.component';

@Component({
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, LoaderComponent],
  selector: 'app-filters',
  templateUrl: 'filters.component.html',
  styleUrls: ['filters.component.scss']
})
export class FiltersComponent{

  loaded: boolean = false; 
  formGroup!: FormGroup;

  sortedLocationsType = computed(() => this.locationService.locationTypes().sort((a, b) => a.name.trim().localeCompare(b.name.trim(), "fr", { sensitivity: "base" })));
  sortedCountries = computed(() => this.locationService.countries().sort((a, b) => a.name.trim().localeCompare(b.name.trim(), "fr", { sensitivity: "base" })));

  constructor(
    private locationService: LocationService, 
    private formBuilder: FormBuilder)
  {
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

  private createForm() {
    this.formGroup = this.formBuilder.group({
      typeIDs: [this.locationService.locationSearchRequest()?.typeIDs],
      country: [this.locationService.locationSearchRequest()?.country],
      limitDate: [this.locationService.locationSearchRequest()?.limitDate ?? moment().format('YYYY-MM-DD')],
    });
  }
}
