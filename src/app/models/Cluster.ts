export class Cluster {
  constructor() {}

  id: string = "";
  maxLat!: number;
  maxLng!: number;
  minLat!: number;
  minLng!: number;
  countLocation!: number;
}

export class ClusterRequest extends Cluster {
  constructor() {
    super();
  }
}

export class ClusterMap extends Cluster {
  constructor() {
    super();
  }

  layer?: L.LayerGroup<any>;
  locationMarkers?:  L.Marker<any>[];
}
