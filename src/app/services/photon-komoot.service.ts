import { Injectable, signal } from '@angular/core';
import { HttpService } from './services.common/http-service';
import { firstValueFrom } from 'rxjs';
import { apiURL } from '../constants/apiURL';
import { PhotonKomootResult } from '../models/PhotonKomootResult';

@Injectable({
  providedIn: 'root',
})
export class PhotonKomootService {
  
  displayModal = signal(false);

  constructor(private httpService: HttpService) {}

  search(search: string): Promise<PhotonKomootResult>{
    const params = { q: search, limit: '10' };

    return firstValueFrom(this.httpService.get(`${apiURL.PhotonKomoot}`, params));
  }
}
