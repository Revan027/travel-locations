import { Injectable } from '@angular/core';
import { HttpService } from './services.common/http-service';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { apiURL } from '../constants/apiURL';

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {

  constructor(private httpService: HttpService) {}
  
  getImageUrl(publicID: string): string{
    return `${apiURL.Cloudinary.Public}/w_400,h_400,c_fill,g_auto,q_auto:good,f_auto/${publicID}`;
  }

  uploadImage(file: File): Promise<any>{
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", environment.cloudinary.apiKey);
    formData.append("upload_preset", environment.cloudinary.uploadPreset);
  
    return firstValueFrom(this.httpService.post(apiURL.Cloudinary.Upload, formData))
  }

  deleteImage(){

  }
}
