export class UserGeolocalisation {
  constructor() {}
  
  id: string = "";
  altitude?: number; 
  latitude!: number;
  longitude!: number;
  readonly displayName: string = "";
  readonly email: string = "";
  lastUpdateGeoloc!: Date;
}
