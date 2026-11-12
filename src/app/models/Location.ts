import { DocumentData, DocumentReference, Timestamp } from "firebase/firestore";

export class Location {
  constructor() {}

  id: string = "";
  name!: string;
  altitude?: number; 
  latitude!: number;
  longitude!: number;
  countryID!: string;
  clusterID!: string;
  typeID!: string;
  typeName!: string;
  typeIcon!: string;
  date!: Timestamp;
  imgUrl?: string;
}

export class LocationRequest extends Location {
  constructor() {
    super();
  }

  typeRef!: DocumentReference<DocumentData, DocumentData>;
  countryRef!: DocumentReference<DocumentData, DocumentData>; 
  ntryRef!: DocumentReference<DocumentData, DocumentData>; 
}

export class LocationMap extends Location{
  constructor() { 
    super();
  }

  marker?: L.Marker<any>;
}
