import PlaceMapView, { type MapProps } from './place-map-view';
import { googleTilesKey } from './map-provider';
export type { MapPin } from './map-markers';

export default function PlaceMap(props: MapProps) {
  return <PlaceMapView {...props} googleKey={googleTilesKey} />;
}
