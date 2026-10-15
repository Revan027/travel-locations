import { Component, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule, IonInfiniteScroll } from '@ionic/angular';
import { Location } from 'src/app/models/Location';
import { LocationService } from 'src/app/services/location.service';
import { AuthStatusComponent } from 'src/app/components/auth-status.component';
import { CloudinaryUrlPipe } from 'src/app/pipes/cloudinary-url.pipe';
import { TimestampPipe } from 'src/app/pipes/timestamp.pipe';
import moment from 'moment';
import { LocationSearchRequest } from 'src/app/models/LocationSearchRequest';
import { from, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LocationGroup } from 'src/app/models/LocationGroup';
import { LocationSearchCounter } from 'src/app/models/LocationSearchCounter';
import { LocationFilterComponent } from 'src/app/components/location-filter/location-filter.component';
import { LocationFilter } from 'src/app/models/LocationFilter';
import { Timestamp } from 'firebase/firestore';

@Component({
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, AuthStatusComponent, CloudinaryUrlPipe, TimestampPipe, LocationFilterComponent],
  selector: 'app-locations',
  templateUrl: 'locations.page.html',
  styleUrls: ['locations.page.scss'],
})
export class LocationsPage {
  private locationsInfinite = viewChild<IonInfiniteScroll>('LocationsInfinite');

  protected disabledInfiniteScroll = signal<boolean>(false);
  protected locationGroups = signal<LocationGroup[]>([]);
  protected counter = signal<LocationSearchCounter>(new LocationSearchCounter());

  private _search$ = new Subject<LocationSearchRequest>();

  private lastID: string = "";
  private locationSearchRequest: LocationSearchRequest = new LocationSearchRequest();
  private locationFilter: LocationFilter = new LocationFilter();

  constructor(private locationService: LocationService) {
   
    moment.locale("fr");  

    // abonnement au changement de filtre
    this._search$
      ?.pipe(
        switchMap((search) => {   // ANNULE la requête précédente 
          return from(this.locationService.getNextPage(search)); // on convertit en observable pour ensuite igniorer le result si besoin d'annuler l'observation
        }),
        takeUntilDestroyed())
      .subscribe((results) => {
        this.searchCompleted(results);
      }
    );

    // abonnement au changement de lieux
    this.locationService.locationsChanged$
      ?.pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.initSearch();
      }
    );
  } 

  async initSearch(){ 
    this.setDisabledInfiniteScroll(false);

    let locationSearchRequest: LocationSearchRequest = new LocationSearchRequest();
    locationSearchRequest.beginDate = Timestamp.fromDate(moment(this.locationFilter.date).toDate());
    locationSearchRequest.endDate = Timestamp.fromDate(moment(this.locationFilter.date).add(1, "years").add(-1, "days").toDate());  
    locationSearchRequest.typeIDs = this.locationFilter.typeIDs;

    this.setLocationSearchRequest(locationSearchRequest);
    this.setLocationGroups([]);

    this._search$?.next(locationSearchRequest);// envoie d'une nouvelle requete 
    this.setCounter(await this.locationService.getCounterSearch(locationSearchRequest));
  }

  searchCompleted(results: Location[]){
    if(results.length == 0){
      this.setDisabledInfiniteScroll(true);
    }
    else{
      this.lastID = results[results.length - 1].id
      this.setLocationGroups(this.locationService.goupByMonth(results, this.locationGroups()));
    }

    this.locationsInfinite()?.complete();
  }

  async getNextPage(){
    let locationSearchRequest: LocationSearchRequest = this.locationSearchRequest;
    locationSearchRequest.currentPage = locationSearchRequest.currentPage + 1;
    locationSearchRequest.lastIDResult = this.lastID;

    this.setLocationSearchRequest(locationSearchRequest);

    this._search$?.next(locationSearchRequest);// envoie d'une nouvelle requete 
  }

  nextResults(event: any){
    this.getNextPage();
  }

  onFilterChanged(locationFilter: LocationFilter){
    this.locationFilter = locationFilter;

    this.initSearch();
  }

  private setCounter(value: LocationSearchCounter){
    this.counter.set({...value}); 
  } 

  private setLocationGroups(value: LocationGroup[]){
    this.locationGroups.set([...value]); 
  }

  private setDisabledInfiniteScroll(value: boolean){
    this.disabledInfiniteScroll.set(value); 
  }

  private setLocationSearchRequest(value: LocationSearchRequest){
    this.locationSearchRequest = {...value};
  }
}
