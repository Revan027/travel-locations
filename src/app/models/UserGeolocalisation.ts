export class UserGeolocalisation {
  constructor() {}
  
  id: string = "";
  altitude?: number; 
  latitude!: number;
  longitude!: number;
  readonly email: string = "";
  lastUpdateGeoloc!: Date;
}
