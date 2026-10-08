import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { Location } from '../models/Location';
import moment from 'moment';
import { UserGeolocalisation } from '../models/UserGeolocalisation';
import { Position } from '../models/Position';
import { LocationService } from './location.service';
import { CloudinaryService } from './cloudinary.service';

@Injectable({
  providedIn: 'root',
})
export class MarkerFactoryService {
  constructor(private locationService: LocationService, private cloudinaryService: CloudinaryService) {}

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

          <div class="user-card-content current-text">
            <div class="color-e05e2f material-icons">schedule</div>

            <div>
              Dernier relevé :  <b>${moment(userGeolocalisation.lastUpdateGeoloc.toDate()).format("DD/MM/YYYY à HH[h]mm")}</b>
            </div>
          </div>
        </div>`, {className: "user-popup"});
  }

  buildLocationMarker(location: Location){
    const imgSrc = location.imgUrl ? this.cloudinaryService.getImageUrl(location.imgUrl) : "assets/placeholder.webp";

    const locationIcon = L.divIcon({
      html: `<span class="material-icons">${location.typeIcon}</span>`,
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],    
      className: 'custom-marker location'
    });

    return L.marker([location.latitude, location.longitude], {icon: locationIcon})
      .bindPopup(`
        <div class="location-card" data-id="${location.id}">
          <div class="location-card-header mb-1">      
            <ion-img src="${imgSrc}" class="location-illustration" alt=""></ion-img>
          </div>

          <div class="location-card-content">
            <div class="card-title">
              ${location.name}
            </div>

            <div class="curren-text">
              ${location.countryID.toUpperCase()}
            </div>

            <div class="location-card-meta mt-2">
              <div class="meta-item">
                  <div class="meta-title mb-1">
                    Visité
                  </div>

                  <div class="meta-data">
                    ${this.locationService.getFormatedDate(location.date)}
                  </div>
              </div>

              <div class="meta-item">
                <div class="meta-title mb-1">
                  Altitude
                </div>

                 <div class="meta-data">
                    ${location.altitude ?? "-"}
                  </div>
              </div>

              <div class="meta-item">
                <div class="meta-title mb-1">
                  GPS
                </div>

                 <div class="meta-data">
                    ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}
                  </div>
              </div>
            </div>
          </div>

          <div class="location-card-footer ion-text-center">
            <ion-button class="button-main btn-see-location" [strong]="true">Voir la fiche</ion-button>
          </div>
        </div>`, { maxWidth: 350, className: "location-popup", autoPanPadding: [50, 80] });
  }

  buildNewLocationMarker(position: Position){
    const newLocationIcon = L.divIcon({
        html: '<ion-icon name="location"></ion-icon> <span class="text-marker-info">Clique ici</span>',
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        className: 'custom-marker new-location'
    });

    return L.marker([position.latitude, position.longitude], {draggable: true, icon: newLocationIcon});
  }
}
