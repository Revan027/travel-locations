import * as L from 'leaflet';
import { LocationMap } from './Location';
export class ClusterRequest {
  constructor() {}

  maxLat!: number;
  maxLng!: number;
  minLat!: number;
  minLng!: number;
  countLocation!: number;
}

export class Cluster extends ClusterRequest {
  constructor() { 
    super();
  }

  id: string = "";
}

export class ClusterMap extends Cluster {
  constructor() {
    super();
  }

  layer?: L.LayerGroup<any>;
  locations?: LocationMap[];
  subClusterLayer?: L.LayerGroup<any>;
}
