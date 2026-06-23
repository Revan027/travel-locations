import { Timestamp } from "firebase/firestore";

export class LocationSearchRequest {
  constructor() {}

  limitDate?: Timestamp;
  typeIDs: number[] = [];
  country: string = "";
}
