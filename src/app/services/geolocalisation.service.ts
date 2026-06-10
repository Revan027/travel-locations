import { Injectable, signal } from '@angular/core';
import { Geolocation, Position as GPosition } from '@capacitor/geolocation';
import { Position } from '../models/Position';

@Injectable({
  providedIn: 'root',
})
export class GeolocalisationService {
  position = signal<Position>(new Position);

  async getCurrentPosition(): Promise<boolean>{
    let authorisation = await this.checkAuthorisation();

    if (!authorisation){
        return false;
    }

    const position = await Geolocation.getCurrentPosition({ timeout: 10000, enableHighAccuracy: true }).catch(() => null)

    if (!position) 
      return false;

    this.position.set({ latitude: position.coords.latitude, longitude: position.coords.longitude, altitude: position.coords.altitude} as Position);

    return true;
  }

  private async checkAuthorisation(): Promise<boolean>{
    let permission = await Geolocation.checkPermissions();

    if (permission.location != "granted"){
      permission = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation']})

      return permission.location == "granted";
    }

    return permission.location == "granted";
  }
}
