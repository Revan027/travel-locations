import { Location } from "./Location";

export class Cluster {
  constructor() {}
  
  isVisible?: boolean = false;
  bounds!: L.LatLngBounds;
  locations!: Location[];
  locationsMarker:  L.Marker<any>[] = [];
}
