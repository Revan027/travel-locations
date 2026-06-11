import { Location as ALocation } from '@angular/common';
import { Component, AfterViewInit, inject, DestroyRef, WritableSignal, computed, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GestureController, IonicModule } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Location, LocationRequest } from 'src/app/models/Location';
import { LocationService } from 'src/app/services/location.service';
import moment from 'moment';
import { ToastService } from 'src/app/services/services.common/toast.service';
import { MessageEnum } from 'src/app/services/services.common/enum/MessageEnum';
import { StatusEnum } from 'src/app/services/services.common/enum/status.enum';
import { ConfirmationService } from 'src/app/services/services.common/confirmation.service';
import { MapService } from 'src/app/services/map.service';
import { CloudinaryService } from 'src/app/services/cloudinary.service';
import { LoaderComponent } from 'src/app/components/loader.component';
import { AltitudeService } from 'src/app/services/altitude.service';

@Component({
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, LoaderComponent],
  selector: 'app-edit-location',
  templateUrl: 'edit-location.page.html',
  styleUrls: ['edit-location.page.scss'],
})
export class EditLocationPage implements AfterViewInit {
  @ViewChild('inputFile') inputFile!: ElementRef;

  private destroyRef = inject(DestroyRef);

  loaded: boolean = false;
  uploadLoaded: boolean = false;

  formGroup!: FormGroup;
  location: Location = new Location();
  
  sortedLocationsType = computed(() => this.locationService.locationTypes().sort((a, b) => a.name.trim().localeCompare(b.name.trim(), "fr", { sensitivity: "base" })));
  sortedCountries = computed(() => this.locationService.countries().sort((a, b) => a.name.trim().localeCompare(b.name.trim(), "fr", { sensitivity: "base" })));

  constructor(
    private aLocation: ALocation,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private gestureCtrl: GestureController,
    private formBuilder: FormBuilder,
    private router: Router,
    private locationService: LocationService,
    private mapService: MapService,
    private toastService: ToastService,
    private cloudinaryService: CloudinaryService,
    private altitudeService: AltitudeService,
  )
  {
    moment.locale("fr");  
  }

  goBack() {
    this.aLocation.back();
  }

  async ionViewDidEnter() {  
    // Ecoute de l'event si l'url change. On ne repasse pas 2 fois dans un ngOnInit normalement
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (params) => {
      this.loaded = false;

      const id = params.get('id');

      if (id) {
        this.location = this.locationService.locations().find((location) => location.id == id) || new Location();

        this.createForm();
      } 
      else {
        this.location.latitude = Number(params.get('lat'));
        this.location.longitude = Number(params.get('lng'));

        this.createForm();

        this.altitudeService.getAltitude(this.location.latitude, this.location.longitude)
          .subscribe({
            next: (result) => {
              this.location.altitude = result.elevation[0];

              this.formGroup.get('altitude')?.setValue(this.location.altitude);
            },
            error: (err) => {this.location.altitude = undefined }
          });
      }

      this.loaded = true;
    });
  }

  ngAfterViewInit() {
    // on active l'écoute du swipe pour le retour
    /*const gesture = this.gestureCtrl.create({
      el: this.el.nativeElement,
      gestureName: 'swipe-back',
      direction: 'x',
      onEnd: (detail) => {
        if (detail.deltaX > 50) {
          this.goBack();
        }
      },
    });
    gesture.enable();*/
  }

  private createForm() {
    this.formGroup = this.formBuilder.group({
      name: [this.location.name, Validators.compose([Validators.required])],
      altitude: [this.location.altitude],
      latitude: [{ value: this.location.latitude, disabled: this.location.id != "" }, Validators.required],
      longitude: [{ value: this.location.longitude, disabled: this.location.id != "" }, Validators.required],
      typeID: [this.location.typeID, Validators.required],
      countryID: [this.location.countryID, Validators.required],
      date: [this.location.date ?? moment().format('YYYY-MM-DD'), Validators.required],
      imgUrl: [this.location.imgUrl],
    });
  }

  async onSubmit(locationRequest: LocationRequest) {
    let isSuccess = true,
    locationsType = this.locationService.locationTypes().find(item => item.id == locationRequest.typeID);

    locationRequest.typeIcon = locationsType?.icon ?? "";
    locationRequest.typeName = locationsType?.name ?? "";

    if (this.location.id){
      await this.locationService.update(this.location.id, locationRequest).catch(() => isSuccess = false);
    }
    else{
      isSuccess = await this.locationService.create(locationRequest).then(() => isSuccess = true).catch(() => isSuccess = false);

      this.mapService.removeNewLocationMarker();
    }

    if (isSuccess){
      this.toastService.get(MessageEnum.AppSuccess, StatusEnum.Success);

      await this.locationService.search(this.locationService.locationSearchRequest());

      this.router.navigate(['/map']);
    }  
  }

  async onDelete() {
    var me = this;

    let callback = async function(){
      let isSuccess = true;

      await me.locationService.delete(me.location.id).catch(() => isSuccess = false),

      await me.toastService.get(isSuccess ? MessageEnum.AppSuccess : MessageEnum.AppError, isSuccess ? StatusEnum.Success : StatusEnum.Danger);
      
      await me.locationService.search(me.locationService.locationSearchRequest());

      me.router.navigate(['/map']);
    }

    await this.confirmationService.getModalDelete(callback);
    
    this.createForm();    
  }

  onFileSelector(event: Event) {
    this.inputFile.nativeElement.click();
  }

  async onFileChanged(event: any) {
    this.uploadLoaded = true;

    const result =  await this.cloudinaryService.uploadIamge(event.target.files[0]);
  
    this.location.imgUrl = result.secure_url;
    this.formGroup.get("imgUrl")?.setValue(this.location.imgUrl);
    
    this.uploadLoaded = false;
  }
}
