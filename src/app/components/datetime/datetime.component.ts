import { Component, Input, output } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { Timestamp } from 'firebase/firestore';
import { DatetimeModalComponent } from '../datetime-modal/datetime-modal.component';
import { LocationService } from 'src/app/services/location.service';
import { TimestampPipe } from 'src/app/pipes/timestamp.pipe';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [IonicModule, TimestampPipe, ReactiveFormsModule],
  selector: 'app-datetime',
  templateUrl: 'datetime.component.html',
  styleUrls: ['datetime.component.scss']
})
export class DatetimeComponent {
  @Input("date") date?: Timestamp;
  @Input("controlName") controlName!: string;
  @Input("label") label!: string;
  @Input("formGroup") formGroup!: FormGroup;

  dateChanged = output<Timestamp | undefined>();// on signal que la date change au parent

  constructor(private modalCtrl: ModalController, private locationService: LocationService) {
  }

  ngOnInit() {
  }

  async openDatetimeModal() {
    const modal = await this.modalCtrl.create({
      component: DatetimeModalComponent,
      componentProps: { date: this.locationService.getFormatedDate(this.date, "YYYY-MM-DD") },
      cssClass: "datetime-modal"
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();

    if(data){
      this.date = Timestamp.fromDate(new Date(data));

      this.emitDateChanged();
    }
  }

  emitDateChanged(){
    this.dateChanged.emit(this.date);
  }
}
