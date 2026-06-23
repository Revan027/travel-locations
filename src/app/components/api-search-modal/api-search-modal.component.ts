import { Component, HostListener, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PhotonKomootFeature, PhotonKomootResult } from 'src/app/models/PhotonKomootResult';
import { Position } from 'src/app/models/Position';
import { MapService } from 'src/app/services/map.service';
import { PhotonKomootService } from 'src/app/services/photon-komoot.service';
import { LoaderComponent } from '../loader.component';

@Component({
  standalone: true,
  imports: [IonicModule, FormsModule, LoaderComponent],
  selector: 'app-api-search-modal',
  templateUrl: 'api-search-modal.component.html',
  styleUrls: ['api-search-modal.component.scss']
})
export class ApiSearchModalComponent {
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.photonKomootService.displayModal()) return;

    const target = event.target as HTMLElement;

    // on ne ferme pas si le clic est dans le modal ou sur le bouton qui l'ouvre
    if (!target.closest('.api-search-modal') && !target.closest('.btn-api-search-modal')) {
      this.photonKomootService.displayModal.set(false);
    }
  }

  displayModal: WritableSignal<boolean> = this.photonKomootService.displayModal;

  apiSearchLoading = false;
  apiSearchResult?: PhotonKomootResult;
  apiSearchText: string = '';
  apiSearchError: string = '';

  constructor(private mapService: MapService, private photonKomootService: PhotonKomootService) {
  }

  ngOnInit() {
  }

  async onSubmitPhotonKomootSearch(){
    this.apiSearchLoading = true;
    this.apiSearchError = '';

    try {
      this.apiSearchResult = await this.photonKomootService.search(this.apiSearchText);
    }
    catch (e) {
      this.apiSearchResult = undefined;
      this.apiSearchError = 'La recherche a échoué. Réessaie dans un instant.';
    }
    finally {
      this.apiSearchLoading = false;
    }
  }

  onClickApiFeature(feature: PhotonKomootFeature){
    this.photonKomootService.displayModal.set(false);
    const position: Position = {latitude: feature.geometry.coordinates[1], longitude: feature.geometry.coordinates[0]};

    this.mapService.flyTo(position, 14);
    this.mapService.placeNewLocationMarker(position);
  }
}
