import { Location } from "./Location";

export class Cluster {
  constructor() {}

  id: string = "";
  maxLat!: number;
  maxLng!: number;
  minLat!: number;
  minLng!: number;
  layer?: L.LayerGroup<any>;
  locationMarkers?:  L.Marker<any>[];
}
