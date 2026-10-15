export class LocationFilter {
  constructor(year: string = "", typeIDs: string[] = []) {
    this.date = year;
    this.typeIDs = typeIDs;
  }

  date: string;
  typeIDs: string[];
}
