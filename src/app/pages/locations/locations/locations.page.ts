import { Component, signal, Signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule, IonInfiniteScroll } from '@ionic/angular';
import { Location } from 'src/app/models/Location';
import { LocationService } from 'src/app/services/location.service';
import { AuthStatusComponent } from 'src/app/components/auth-status.component';
import { CloudinaryUrlPipe } from 'src/app/pipes/cloudinary-url.pipe';
import { TimestampPipe } from 'src/app/pipes/timestamp.pipe';
import { LocationType } from 'src/app/models/LocationType';
import moment from 'moment';
import { Timestamp } from 'firebase/firestore';
import { LocationSearchRequest } from 'src/app/models/LocationSearchRequest';
import { from, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LocationGroup } from 'src/app/models/LocationGroup';

@Component({
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, AuthStatusComponent, CloudinaryUrlPipe, TimestampPipe],
  selector: 'app-locations',
  templateUrl: 'locations.page.html',
  styleUrls: ['locations.page.scss'],
})
export class LocationsPage {
  private locationsInfinite = viewChild<IonInfiniteScroll>('LocationsInfinite');

  protected disabledInfiniteScroll = signal<boolean>(false);
  protected locationTypeIDs = signal<string[]>([]);
  protected locationDate = signal<string>(moment().format("YYYY"));
  protected locationDates = signal<string[]>([]);
  protected locationGroups = signal<LocationGroup[]>([]);
  protected locationSearchRequest = signal<LocationSearchRequest>(new LocationSearchRequest());

  protected locationTypes: Signal<LocationType[]>;

  private _search$ = new Subject<LocationSearchRequest>();

  private lastID: string = "";

  constructor(private locationService: LocationService) {
   
    moment.locale("fr");  

    this.locationTypes = this.locationService.locationTypes;

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
  } 

  async ngOnInit(){
    this.getAvailableDates(); 
    
    this.initSearch();
  }  

  async initSearch(){ 
    this.setDisabledInfiniteScroll(false);

    let locationSearchRequest: LocationSearchRequest = new LocationSearchRequest();
    locationSearchRequest.beginDate = Timestamp.fromDate( moment(this.locationDate()).toDate());
    locationSearchRequest.endDate = Timestamp.fromDate(moment(this.locationDate()).add(1, "years").add(-1, "days").toDate());  
    locationSearchRequest.typeIDs = this.locationTypeIDs();

    this.setLocationSearchRequest(locationSearchRequest);
    this.setLocationGroups([]);

    this._search$?.next(locationSearchRequest);// envoie d'une nouvelle requete 
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
    let locationSearchRequest: LocationSearchRequest = this.locationSearchRequest();
    locationSearchRequest.currentPage = locationSearchRequest.currentPage + 1;
    locationSearchRequest.lastIDResult = this.lastID;

    this.setLocationSearchRequest(locationSearchRequest);

    this._search$?.next(locationSearchRequest);// envoie d'une nouvelle requete 
  }

  async getAvailableDates(){
    const minMax = await this.locationService.getAvailableDates();
    const dateMin = moment((minMax.min as Timestamp).toDate()).format("YYYY");
    const dateMax = moment((minMax.max as Timestamp).toDate()).format("YYYY");

    for(let i = Number(dateMin); i <= Number(dateMax); i++){
      this.setLocationDates(i.toString());
    }
  }
  
  nextResults(event: any){
    this.getNextPage();
  }

  onDateChanged(year: string = ""){
    this.updateLocationDate(year); 
    
    this.initSearch();
  }

  onTypeChanged(id: string = ""){
    if(!id){
      this.resetLocationTypeIDs();
    }
    else if(this.locationTypeIDs().includes(id)){
      this.removeLocationTypeIDs(id);
    }
    else{
      this.setLocationTypeIDs(id);
    }

   this.initSearch();
  } 

  private updateLocationDate(value: string){
    this.locationDate.update(x => value); 
  } 

  private setLocationGroups(value: LocationGroup[]){
    this.locationGroups.set([...value]); 
  }

  private setDisabledInfiniteScroll(value: boolean){
    this.disabledInfiniteScroll.set(value); 
  }

  private setLocationSearchRequest(value: LocationSearchRequest){
    this.locationSearchRequest.set({...value}); 
  }
  
  private setLocationDates(value: string){
    let ids = this.locationDates();
    ids.push(value);

    this.locationDates.set(...[ids]); 
  }

  private setLocationTypeIDs(value: string){
    let ids = this.locationTypeIDs();
    ids.push(value);

    this.locationTypeIDs.set(...[ids]);    
  }

  private removeLocationTypeIDs(value: string){
    let ids = this.locationTypeIDs();
  
    this.locationTypeIDs.set(...[ids.filter(x => x != value)]);    
  }

  private resetLocationTypeIDs(){
    this.locationTypeIDs.set([]);    
  }
}
