export interface PhotonKomootResult {
  features: PhotonKomootFeature[];
}


export interface PhotonKomootFeature {
  geometry: {
    coordinates: number[]
  }
  properties: {
    country: string,
    name: string,
    postcode: string,
    state: string,
    type: string,
    county: string,
    osm_id: number,
  }
}