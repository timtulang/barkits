import type * as Leaflet from 'leaflet';
import type { Point } from './geo';

export type MapPin = { point: Point; label: string; kind: 'origin' | 'venue'; venueId?: string; number?: number };

export function framePins(L: typeof Leaflet, map: Leaflet.Map, pins: MapPin[]) {
  const numbered = pins.some(pin => pin.number !== undefined);
  map.fitBounds(L.latLngBounds(pins.map(pin => pin.point)), {
    padding: numbered ? [48, 52] : [24, 24], maxZoom: numbered ? 17 : 15, animate: false,
  });
}

export function addPins(L: typeof Leaflet, map: Leaflet.Map, pins: MapPin[], select: (id: string) => void) {
  const layer = L.layerGroup().addTo(map);
  const numbered: { marker: Leaflet.Marker; point: Point }[] = [];
  const leaders = L.layerGroup().addTo(layer);
  for (const pin of pins) {
    const pointer = document.createElement('span');
    const isNumbered = pin.number !== undefined;
    pointer.className = pin.kind === 'origin' ? 'origin-pin' : 'venue-pin';
    if (isNumbered) {
      const number = document.createElement('b');
      number.textContent = String(pin.number);
      pointer.append(number);
    }
    const icon = L.divIcon({
      className: isNumbered ? 'suggestion-marker' : '',
      html: pointer,
      iconSize: isNumbered ? [44, 44] : [16, 16],
      iconAnchor: isNumbered ? [22, 40] : [8, 8],
    });
    const marker = L.marker(pin.point, { icon, title: pin.label, alt: pin.label, zIndexOffset: isNumbered ? 1000 : 0 }).addTo(layer);
    marker.getElement()?.setAttribute('aria-label', pin.label);
    const id = pin.venueId;
    if (id !== undefined) {
      numbered.push({ marker, point: pin.point });
      marker.on('click', () => select(id));
      marker.on('keydown', (event: Leaflet.LeafletKeyboardEvent) => {
        if (event.originalEvent.key === 'Enter' || event.originalEvent.key === ' ') {
          L.DomEvent.stop(event.originalEvent);
          select(id);
        }
      });
    } else {
      const text = document.createElement('span');
      text.textContent = pin.label;
      marker.bindPopup(text);
    }
  }

  function separateNearbyPins() {
    leaders.clearLayers();
    const occupied: Leaflet.Point[] = [];
    for (const { marker, point } of numbered) {
      const anchor = map.latLngToLayerPoint(point);
      let display = anchor;
      for (const offset of [[0, 0], [46, 0], [-46, 0], [0, 46], [0, -46]]) {
        display = anchor.add(L.point(offset[0], offset[1]));
        if (occupied.every(other => Math.abs(other.x - display.x) >= 44 || Math.abs(other.y - display.y) >= 44)) break;
      }
      occupied.push(display);
      const position = map.layerPointToLatLng(display);
      marker.setLatLng(position);
      if (!display.equals(anchor)) {
        L.polyline([point, position], { color: '#4c285c', weight: 2, interactive: false }).addTo(leaders);
      }
    }
  }

  separateNearbyPins();
  map.on('zoomend', separateNearbyPins);
  return () => { map.off('zoomend', separateNearbyPins); layer.remove(); };
}
