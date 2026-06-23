import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  standalone: true,
  imports: [IonicModule],
  selector: 'app-datetime',
  templateUrl: 'datetime.component.html',
  styleUrls: ['datetime.component.scss']
})
export class DatetimeComponent {

  constructor() {
  }

  ngOnInit() {
  }
}
