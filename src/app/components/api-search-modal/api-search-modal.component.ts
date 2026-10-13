import { Component, HostListener, Signal, signal, WritableSignal } from '@angular/core';
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
  styleUrls: ['api-search-modal.component.scss'],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ApiSearchModalComponent {
  onDocumentClick(event: MouseEvent) {
    if (!this.displayModal()) return;

    const target = event.target as HTMLElement;

    // on ne ferme pas si le clic est dans le modal ou sur le bouton qui l'ouvre
    if (!target.closest('.api-search-modal') && !target.closest('.btn-api-search-modal')) {
      this.photonKomootService.setDisplayModal(false);
    }
  }

  protected displayModal: Signal<boolean>;
  
  protected apiSearchLoading = signal<boolean>(false);
  protected apiSearchResult = signal<PhotonKomootResult | undefined>(undefined);
  protected apiSearchError = signal<string>("");

  protected apiSearchText = "";

  constructor(private mapService: MapService, private photonKomootService: PhotonKomootService) {
    this.displayModal = this.photonKomootService.displayModal;
  }

  ngOnInit() {
  }

  async onSubmitPhotonKomootSearch(){
    this.setApiSearchLoading(true);
    this.setApiSearchError('');

    try {
      this.setApiSearchResult(await this.photonKomootService.search(this.apiSearchText));
    }
    catch (e) {
      this.setApiSearchResult(undefined);
      this.setApiSearchError('La recherche a échoué. Réessaie dans un instant.');
    }
    finally {
      this.setApiSearchLoading(false);
    }
  }

  onClickApiFeature(feature: PhotonKomootFeature){
    this.photonKomootService.setDisplayModal(false);

    const position: Position = {latitude: feature.geometry.coordinates[1], longitude: feature.geometry.coordinates[0]};

    this.mapService.flyTo(position, 14);
    this.mapService.placeNewLocationMarker(position);
  }

  private setApiSearchLoading(value: boolean){
    this.apiSearchLoading.set(value)
  }

  private setApiSearchError(value: string){
    this.apiSearchError.set(value)
  }

  private setApiSearchResult(value: PhotonKomootResult | undefined){
    this.apiSearchResult.set(value)
  }
}
