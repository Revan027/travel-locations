import { Injectable } from '@angular/core';
import { HttpService } from './services.common/http-service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AltitudeService {
  constructor(private httpService: HttpService) {}

  getAltitude(lat: number, lng: number) {
    return this.httpService.get<any>(environment.apiOpenMeteo.replace("{X}", lat.toString()).replace("{Y}", lng.toString()))
  }
}