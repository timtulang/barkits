import type * as Leaflet from 'leaflet';
import type { Point } from './geo';
import { palette } from './theme';

export type MapPin = { point: Point; label: string; kind: 'origin' | 'venue'; venueId?: string; number?: number; initials?: string };

export function framePins(L: typeof Leaflet, map: Leaflet.Map, pins: MapPin[]) {
  const interactive = pins.some(pin => pin.venueId !== undefined);
  map.fitBounds(L.latLngBounds(pins.map(pin => pin.point)), {
    paddingTopLeft: interactive ? [56, 56] : [24, 24],
    paddingBottomRight: interactive ? [48, 52] : [24, 24], maxZoom: interactive ? 17 : 15, animate: false,
  });
}

export function addPins(L: typeof Leaflet, map: Leaflet.Map, pins: MapPin[], select: (id: string) => void) {
  const layer = L.layerGroup().addTo(map);
  const positioned: { marker: Leaflet.Marker; point: Point }[] = [];
  const leaders = L.layerGroup().addTo(layer);
  for (const pin of pins) {
    const pointer = document.createElement('span');
    const isInteractive = pin.venueId !== undefined;
    pointer.className = pin.kind === 'origin' ? 'origin-pin' : 'venue-pin';
    if (pin.number !== undefined) {
      const number = document.createElement('b');
      number.textContent = String(pin.number);
      pointer.append(number);
    } else if (pin.initials) {
      pointer.classList.add('friend-pin');
      pointer.textContent = pin.initials;
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
    if (id !== undefined || pin.initials) positioned.push({ marker, point: pin.point });
    if (id !== undefined) {
      marker.getElement()?.addEventListener('mousedown', event => event.stopPropagation());
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
    for (const { marker, point } of positioned) {
      const anchor = map.latLngToLayerPoint(point);
      let display = anchor;
      for (const [x, y] of [[0, 0], [46, 0], [-46, 0], [0, 46], [0, -46], [46, 46], [-46, -46], [46, -46], [-46, 46]]) {
        const candidate = anchor.add(L.point(x, y));
        const screen = map.layerPointToContainerPoint(candidate);
        const size = map.getSize();
        if (screen.x < 22 || screen.y < 22 || screen.x > size.x - 22 || screen.y > size.y - 22) continue;
        if (occupied.every(other => Math.abs(other.x - candidate.x) >= 44 || Math.abs(other.y - candidate.y) >= 44)) {
          display = candidate;
          break;
        }
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
