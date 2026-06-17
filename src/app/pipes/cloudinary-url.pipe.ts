import { Pipe, PipeTransform } from '@angular/core';
import { CloudinaryService } from '../services/cloudinary.service';

@Pipe({
  standalone: true,
  name: 'cloudinaryUrl',
})
export class CloudinaryUrlPipe implements PipeTransform {

  constructor(private cloudinaryService: CloudinaryService) {}

  transform(value: string): string {
    return this.cloudinaryService.getImageUrl(value);
  }
}
