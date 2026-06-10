import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Cluster } from '../models/Cluster';
import { Location } from '../models/Location';
import moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class MarkerFactoryService {
  
  createUserMarker(latitude: number, longitude: number){
    const monIcon = L.divIcon({
      html: '<span class="material-icons-outlined">my_location</span>',
      iconAnchor: [18, 18],
      popupAnchor: [0, -32],
      className: 'custom-marker user'
    });

    return L.marker([latitude, longitude], {icon: monIcon});
  }

  buildLocationMarker(location: Location){
    const locationIcon = L.divIcon({
      html: `<span class="material-icons">${location.typeIcon}</span>`,
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      
      className: 'custom-marker'
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
