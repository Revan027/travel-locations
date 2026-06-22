import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Location } from '../models/Location';
import moment from 'moment';
import { UserGeolocalisation } from '../models/UserGeolocalisation';
import { Position } from '../models/Position';
import { LocationService } from './location.service';

@Injectable({
  providedIn: 'root',
})
export class MarkerFactoryService {
  constructor(private locationService: LocationService) {}

  buildUserMarker(userGeolocalisation: UserGeolocalisation){
    const monIcon = L.divIcon({
      html: `<span>${userGeolocalisation.displayName[0].toUpperCase() + userGeolocalisation.displayName[1]}</span>`,
      iconAnchor: [20, 20],
      iconSize: [40, 40],
      popupAnchor: [0, -20],
      className: 'custom-marker user'
    });

    return L.marker([userGeolocalisation.latitude, userGeolocalisation.longitude], {icon: monIcon})
      .bindPopup(`
        <span data-id="${userGeolocalisation.id}">
          <p class="title">${userGeolocalisation.displayName}</p>
          <p class="section"><span class="material-icons">calendar_month</span> Dernier relevé le : ${moment(userGeolocalisation.lastUpdateGeoloc.toDate()).format("DD/MM/YYYY à HH[h]mm")}</p>
        </span>`, {className: "user-popup"});
  }

  buildLocationMarker(location: Location){

    const locationIcon = L.divIcon({
      html: `<span class="material-icons">${location.typeIcon}</span>`,
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],    
      className: 'custom-marker location'
    });

    return L.marker([location.latitude, location.longitude], {icon: locationIcon})
      .bindPopup(`
        <span data-id="${location.id}">
          <p class="title">${location.name}</p>
          <p class="section"><span class="material-icons">calendar_month</span>${this.locationService.getFormatedDate(location.date)}</p>
          <p class="section"><span class="material-icons">location_on</span>${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</p>
          <p class="section"><span class="material-icons">terrain</span>${location.altitude ?? "-"}</p> 
        </span>`, { maxWidth: 220, minWidth: 180, className: "location-popup" });
  }

  buildNewLocationMarker(position: Position){
    const newLocationIcon = L.divIcon({
        html: '<ion-icon name="location"></ion-icon>',
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        className: 'custom-marker new-location'
    });

    return L.marker([position.latitude, position.longitude], {draggable: true, icon: newLocationIcon});
  }
}
