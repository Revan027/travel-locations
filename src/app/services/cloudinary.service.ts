import { Injectable } from '@angular/core';
import { HttpService } from './services.common/http-service';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {

  constructor(private httpService: HttpService) {}

  uploadIamge(file: File): Promise<any>{
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", environment.cloudinary.apiKey);
    formData.append("upload_preset", environment.cloudinary.uploadPreset);
  
    return firstValueFrom(this.httpService.post("https://api.cloudinary.com/v1_1/dmxq9d1gs/image/upload", formData))

  }

  deleteImage(){

  }
}
