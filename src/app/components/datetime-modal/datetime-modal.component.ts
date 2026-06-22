import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  standalone: true,
  imports: [IonicModule],
  selector: 'app-datetime-modal',
  templateUrl: 'datetime-modal.component.html',
  styleUrls: ['datetime-modal.component.scss']
})
export class DatetimeModalComponent {
  @Input("date") date: any;
  newValue?: Date;

  constructor(private modalCtrl: ModalController){
  }

  ngOnInit() {
  }
  
  onDateChange(event: CustomEvent) {
    this.newValue = event.detail.value;
  }

  onDateBlur(event: CustomEvent) {
    return this.modalCtrl.dismiss(this.newValue, 'confirm'); 
  }
}
