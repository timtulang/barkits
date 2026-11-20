'use dom';

import { useEffect, useRef, useState } from 'react';
import type { DOMProps } from 'expo/dom';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GoogleRoadmap } from './google-roadmap';
import type { Point } from './geo';

export type MapPin = { point: Point; label: string; kind: 'origin' | 'venue' };

export type MapProps = { pins?: MapPin[]; point?: Point; onPick?: (point: Point) => Promise<void>; dom?: DOMProps };

export default function PlaceMapView({ point, onPick, pins, googleKey }: MapProps & { googleKey?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const [ready, setReady] = useState(false);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const marker = useRef<Leaflet.CircleMarker | null>(null);
  const latest = useRef({ point, onPick });
  latest.current = { point, onPick };
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    let observer: ResizeObserver | undefined;
    Promise.resolve().then(() => {
      const L: typeof Leaflet = require('leaflet');
      leaflet.current = L;
      if (!mounted || !container.current) return;
      const initial = latest.current.point;
      const view = L.map(container.current, { scrollWheelZoom: false, zoomAnimation: false, maxZoom: 19, attributionControl: !googleKey }).setView(initial ?? [14.5995, 120.9842], initial ? 15 : 10);
      map.current = view;
      setReady(true);
      if (!googleKey) L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
      }).on('tileerror', () => setError('Some map tiles could not load. Check your connection or enter coordinates.')).addTo(view);
      marker.current = L.circleMarker(initial ?? view.getCenter(), { radius: 8, color: '#291D32', fillColor: '#F78F78', fillOpacity: 1 });
      if (initial) marker.current.addTo(view);
      view.on('click', event => {
        const position = event.latlng.wrap();
        void latest.current.onPick?.([position.lat, position.lng]);
      });
      observer = new ResizeObserver(() => view.invalidateSize());
      observer.observe(container.current);
    }).catch(() => { if (mounted) setError('Map unavailable. You can still enter coordinates.'); });
    return () => { mounted = false; observer?.disconnect(); map.current?.remove(); map.current = null; marker.current = null; };
  }, [googleKey]);
  const serializedPins = JSON.stringify(pins ?? []);
  useEffect(() => {
    const L = leaflet.current;
    const view = map.current;
    if (!ready || !L || !view) return;
    const points: MapPin[] = JSON.parse(serializedPins);
    if (!points.length) return;
    const layer = L.layerGroup().addTo(view);
    for (const pin of points) {
      const el = document.createElement('span');
      el.textContent = pin.label;
      const icon = L.divIcon({
        className: '',
        html: pin.kind === 'origin' ? '<span class="origin-pin"></span>' : '<span class="venue-pin"></span>',
        iconSize: [16, 16], iconAnchor: [8, 8],
      });
      L.marker(pin.point, { icon, title: pin.label, alt: pin.label }).bindPopup(el).addTo(layer);
    }
    view.fitBounds(L.latLngBounds(points.map(pin => pin.point)), { padding: [24, 24], maxZoom: 15, animate: false });
    return () => { layer.remove(); };
  }, [ready, serializedPins]);
  const lat = point?.[0];
  const lng = point?.[1];
  useEffect(() => {
    if (!map.current || !marker.current) return;
    if (lat === undefined || lng === undefined) { marker.current.remove(); return; }
    marker.current.setLatLng([lat, lng]).addTo(map.current);
    map.current.panTo([lat, lng], { animate: false });
  }, [lat, lng]);
  return <div style={{ width: '100%' }}>
    <style>{'.origin-pin,.venue-pin{display:block;width:14px;height:14px;border:2px solid #291d32;background:#f78f78;border-radius:50%}.venue-pin{background:#ad7bc0;border-radius:2px}'}</style>
    <div ref={container} aria-label="Location map" style={{ height: 240, width: '100%', borderRadius: 12 }} />
    {googleKey && ready && map.current && leaflet.current && <GoogleRoadmap map={map.current} leaflet={leaflet.current} apiKey={googleKey} />}
    {error && <div role="status" style={{ font: '14px sans-serif' }}>{error}</div>}
  </div>;
}
