import { Injectable, signal } from '@angular/core';
import { HttpService } from './capacitor.services.common/http-service';
import { firstValueFrom } from 'rxjs';
import { apiURL } from '../constants/apiURL';
import { PhotonKomootResult } from '../models/PhotonKomootResult';

@Injectable({
  providedIn: 'root',
})
export class PhotonKomootService {
  
  private _displayModal = signal<boolean>(false);
  displayModal = this._displayModal.asReadonly();

  constructor(private httpService: HttpService) {}

  search(search: string): Promise<PhotonKomootResult>{
    const params = { q: search, limit: '10' };

    return firstValueFrom(this.httpService.get(`${apiURL.PhotonKomoot}`, params));
  }

  setDisplayModal(display: boolean){
    this._displayModal.set(display);
  }

  updateDisplayModal(){
    this._displayModal.update(v => !v);
  }
}
