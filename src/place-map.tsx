'use dom';

import { useEffect, useRef, useState } from 'react';
import type { DOMProps } from 'expo/dom';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Point } from './geo';

type Props = { point?: Point; onPick?: (point: Point) => Promise<void>; dom?: DOMProps };

export default function PlaceMap({ point, onPick }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const marker = useRef<Leaflet.CircleMarker | null>(null);
  const latest = useRef({ point, onPick });
  latest.current = { point, onPick };
  const [error, setError] = useState('');
  useEffect(() => {
    let mounted = true;
    let observer: ResizeObserver | undefined;
    import('leaflet').then(L => {
      if (!mounted || !container.current) return;
      const initial = latest.current.point;
      const view = L.map(container.current, { scrollWheelZoom: false }).setView(initial ?? [14.5995, 120.9842], initial ? 15 : 10);
      map.current = view;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
  }, []);
  const lat = point?.[0];
  const lng = point?.[1];
  useEffect(() => {
    if (!map.current || !marker.current) return;
    if (lat === undefined || lng === undefined) { marker.current.remove(); return; }
    marker.current.setLatLng([lat, lng]).addTo(map.current);
    map.current.panTo([lat, lng], { animate: false });
  }, [lat, lng]);
  return <div style={{ width: '100%' }}>
    <div ref={container} aria-label="Location map" style={{ height: 240, width: '100%', borderRadius: 12 }} />
    {error && <div role="status" style={{ font: '14px sans-serif' }}>{error}</div>}
  </div>;
}
