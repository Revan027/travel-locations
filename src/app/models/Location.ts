import { DocumentData, DocumentReference } from "firebase/firestore";

export class Location {
  constructor() {}

  id: string = "";
  name!: string;
  altitude?: number; 
  latitude!: number;
  longitude!: number;
  country!: any;
  typeID!: string;
  typeIcon!: string;
  date!: Date;
}

export class LocationRequest extends Location {
  constructor() {
    super();
  }

  typeRef!: DocumentReference<DocumentData, DocumentData>;
  countryRef!: DocumentReference<DocumentData, DocumentData>; 
}
