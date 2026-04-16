import { DocumentData, DocumentReference } from "firebase/firestore";

export class Location {
  constructor() {}

  id: number = 0;
  name!: string;
  altitude!: number;
  country!: any;
  latitude!: number;
  longitude!: number;
  type!: string;
  date!: Date;
}

export class LocationRequest extends Location {
  constructor() {
    super();
  }

  typeRef!: DocumentReference<DocumentData, DocumentData>;
  countryRef!: DocumentReference<DocumentData, DocumentData>;
}
