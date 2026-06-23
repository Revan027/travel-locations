import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { LocationService } from '../services/location.service';

@Pipe({
  standalone: true,
  name: 'timestampPipe',
})
export class TimestampPipe implements PipeTransform {

  constructor(private locationService: LocationService) {}

  transform(date?: Timestamp): string {
    return this.locationService.getFormatedDate(date);
  }
}
