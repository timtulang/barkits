import PlaceMapView, { type MapProps } from './place-map-view';
import { googleTilesKey } from './map-provider';
export type { MapPin } from './place-map-view';

export default function PlaceMap(props: MapProps) {
  return <PlaceMapView {...props} googleKey={googleTilesKey} />;
}
