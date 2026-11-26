import type * as Leaflet from 'leaflet';
import type { Point } from './geo';
import { palette } from './theme';

export type MapPin = { point: Point; label: string; kind: 'origin' | 'venue'; venueId?: string; number?: number };

export function framePins(L: typeof Leaflet, map: Leaflet.Map, pins: MapPin[]) {
  const interactive = pins.some(pin => pin.venueId !== undefined);
  map.fitBounds(L.latLngBounds(pins.map(pin => pin.point)), {
    paddingTopLeft: interactive ? [56, 56] : [24, 24],
    paddingBottomRight: interactive ? [48, 52] : [24, 24], maxZoom: interactive ? 17 : 15, animate: false,
  });
}

export function addPins(L: typeof Leaflet, map: Leaflet.Map, pins: MapPin[], select: (id: string) => void) {
  const layer = L.layerGroup().addTo(map);
  const numbered: { marker: Leaflet.Marker; point: Point }[] = [];
  const leaders = L.layerGroup().addTo(layer);
  for (const pin of pins) {
    const pointer = document.createElement('span');
    const isInteractive = pin.venueId !== undefined;
    pointer.className = pin.kind === 'origin' ? 'origin-pin' : 'venue-pin';
    if (pin.number !== undefined) {
      const number = document.createElement('b');
      number.textContent = String(pin.number);
      pointer.append(number);
    } else if (isInteractive) {
      pointer.classList.add('confirmed-pin');
    }
    const icon = L.divIcon({
      className: isInteractive ? 'suggestion-marker' : 'group-marker',
      html: pointer,
      iconSize: [44, 44],
      iconAnchor: isInteractive ? [22, 40] : [22, 22],
    });
    const marker = L.marker(pin.point, { icon, title: pin.label, alt: pin.label, zIndexOffset: isInteractive ? 1000 : 0 }).addTo(layer);
    marker.getElement()?.setAttribute('aria-label', pin.label);
    const id = pin.venueId;
    if (id !== undefined) {
      marker.getElement()?.addEventListener('mousedown', event => event.stopPropagation());
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
        L.polyline([point, position], { color: palette.plum, weight: 2, interactive: false }).addTo(leaders);
      }
    }
  }

  separateNearbyPins();
  map.on('zoomend', separateNearbyPins);
  return () => { map.off('zoomend', separateNearbyPins); layer.remove(); };
}
