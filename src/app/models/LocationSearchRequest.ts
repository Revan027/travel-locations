import { DocumentData, DocumentReference, Timestamp } from "firebase/firestore";

export class LocationSearchRequest {
  constructor() {}

  year: string = "";
  beginDate?: Timestamp;
  endDate?: Timestamp;
  typeIDs: string[] = [];
  country: string = "";

  readonly limit: number = 10;
  currentPage: number = 1;
  lastIDResult?: string;
}
