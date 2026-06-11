import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Location } from '../models/Location';
import moment from 'moment';
import { UserGeolocalisation } from '../models/UserGeolocalisation';

@Injectable({
  providedIn: 'root',
})
export class MarkerFactoryService {
  
  buildUserMarker(userGeolocalisation: UserGeolocalisation){
    const monIcon = L.divIcon({
      html: `<span>${userGeolocalisation.email[0].toUpperCase() + userGeolocalisation.email[1]}</span>`,
      iconAnchor: [20, 20],
      iconSize: [40, 40],
      popupAnchor: [0, -20],
      className: 'custom-marker user'
    });

    return L.marker([userGeolocalisation.latitude, userGeolocalisation.longitude], {icon: monIcon});
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
          <p class="section"><span class="material-icons">calendar_month</span>${moment(location.date).format("DD/MM/YYYY")}</p>
          <p class="section"><span class="material-icons">location_on</span>${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</p>
          <p class="section"><span class="material-icons">terrain</span>${location.altitude ?? "-"}</p> 
        </span>`, { maxWidth: 220 });
  }

  buildNewLocationMarker(latLng: L.LatLng){
    const newLocationIcon = L.divIcon({
        html: '<ion-icon name="location"></ion-icon>',
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        className: 'custom-marker new-location'
    });

    return L.marker([latLng.lat, latLng.lng], {draggable: true, icon: newLocationIcon});
  }
}
