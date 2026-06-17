import { Timestamp } from "firebase/firestore";

export class UserGeolocalisation {
  constructor() {}
  
  id: string = "";
  altitude?: number; 
  latitude!: number;
  longitude!: number;
  readonly displayName: string = "";
  readonly email: string = "";
  lastUpdateGeoloc!: Timestamp;
}
