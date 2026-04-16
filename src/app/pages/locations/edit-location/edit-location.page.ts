import { Location as ALocation } from '@angular/common';
import { Component, AfterViewInit, inject, DestroyRef, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GestureController } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Location } from 'src/app/models/Location';
import { LocationType } from 'src/app/models/LocationType';
import { Country } from 'src/app/models/Country';
import { LocationService } from 'src/app/services/location.service';
import moment from 'moment';
import { ToastService } from 'src/app/services/services.common/toast.service';
import { MessageEnum } from 'src/app/services/services.common/enum/MessageEnum';
import { StatusEnum } from 'src/app/services/services.common/enum/status.enum';

@Component({
  selector: 'app-edit-location',
  templateUrl: 'edit-location.page.html',
  styleUrls: ['edit-location.page.scss'],
  standalone: false,
})
export class EditLocationPage implements AfterViewInit {
  private destroyRef = inject(DestroyRef);

  formGroup!: FormGroup;
  location: Location = new Location();
  locationsType: WritableSignal<LocationType[]> = this.locationService.locationTypes;
  countries: WritableSignal<Country[]> = this.locationService.countries;
  loaded: boolean = false;

  constructor(
    private aLocation: ALocation,
    private route: ActivatedRoute,
    private gestureCtrl: GestureController,
    private formBuilder: FormBuilder,
    private router: Router,
    private locationService: LocationService,
    private toastService: ToastService,
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

      const id = Number(params.get('id'));

      if (id) {
        // on charge le lieu
      } 
      else {
        this.location.latitude = Number(params.get('lat'));
        this.location.altitude = Number(params.get('alt'));
        this.location.longitude = Number(params.get('lng'));
      }

      this.createForm();

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
      altitude: [this.location.altitude, Validators.required],
      latitude: [this.location.latitude, Validators.required],
      longitude: [this.location.longitude , Validators.required],
      type: [this.location?.type, Validators.required],
      country: [this.location?.country, Validators.required],
      date: [this.location.date ?? moment().format('YYYY-MM-DD'), Validators.required],
    });
  }

  async onSubmit(location: Location) {
    const result = await this.locationService.create(location);

    if (result){
      this.toastService.get(MessageEnum.AppSuccess, StatusEnum.Success);

      this.router.navigate(['/map']);
    }  
  }
}
