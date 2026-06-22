export class LocationSearchRequest {
  constructor() {}

  limitDate?: string;
  typeIDs: number[] = [];
  country: string = "";
}
