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
      html: UserGeolocalisation.getFirstLetter(userGeolocalisation),
      iconAnchor: [20, 20],
      iconSize: [40, 40],
      popupAnchor: [0, -20],
      className: 'custom-marker user'
    });

    return L.marker([userGeolocalisation.latitude, userGeolocalisation.longitude], {icon: monIcon})
      .bindPopup(`
        <div class="user-card" data-id="${userGeolocalisation.id}">
          <div class="user-card-header mb-1">
            <div class="user-card-firstLetter">
              ${UserGeolocalisation.getFirstLetter(userGeolocalisation)}
            </div>

            <div class="card-title">
               ${userGeolocalisation.displayName}
            </div>
          </div>

          <div class="user-card-content curren-text">
            <div class="color-e05e2f material-icons">schedule</div>

            <div>
              Dernier relevé :  <b>${moment(userGeolocalisation.lastUpdateGeoloc.toDate()).format("DD/MM/YYYY à HH[h]mm")}</b>
            </div>
          </div>
        </div>`
        , {className: "user-popup"});
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
