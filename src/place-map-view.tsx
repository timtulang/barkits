'use dom';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { DOMProps } from 'expo/dom';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map-markers.css';
import { addPins, framePins, type MapPin } from './map-markers';
import { GoogleRoadmap } from './google-roadmap';
import type { Point } from './geo';
import { colors, palette, radius, spacing } from './theme';

export type MapProps = { mapLabel?: string; viewportHeight?: number; onSelectVenue?: (id: string) => Promise<void>; onExpand?: () => Promise<void>; pins?: MapPin[]; point?: Point; onPick?: (point: Point) => Promise<void>; dom?: DOMProps };

export default function PlaceMapView({ point, onPick, pins, onSelectVenue, onExpand, viewportHeight, mapLabel, googleKey }: MapProps & { googleKey?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const [ready, setReady] = useState<Leaflet.Map | null>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const marker = useRef<Leaflet.CircleMarker | null>(null);
  const latest = useRef({ point, onPick, pins, onSelectVenue });
  latest.current = { point, onPick, pins, onSelectVenue };
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    let observer: ResizeObserver | undefined;
    setReady(null);
    setError('');
    setLoading(true);
    Promise.resolve().then(() => {
      const L: typeof Leaflet = require('leaflet');
      leaflet.current = L;
      if (!mounted || !container.current) return;
      const initial = latest.current.point;
      const view = L.map(container.current, { scrollWheelZoom: false, zoomAnimation: false, maxZoom: 19, attributionControl: false });
      const initialPins = latest.current.pins;
      if (initialPins?.length) framePins(L, view, initialPins);
      else view.setView(initial ?? [14.5995, 120.9842], initial ? 15 : 10);
      map.current = view;
      setReady(view);
      if (!googleKey) L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
      }).on('tileerror', () => { if (mounted) { setLoading(false); setError('Some map tiles could not load. Check your connection, then retry.'); } })
        .on('load', () => { if (mounted) setLoading(false); }).addTo(view);
      marker.current = L.circleMarker(initial ?? view.getCenter(), { radius: 8, color: palette.ink, fillColor: palette.coral, fillOpacity: 1 });
      if (initial) marker.current.addTo(view);
      view.on('click', event => {
        const position = event.latlng.wrap();
        void latest.current.onPick?.([position.lat, position.lng]);
      });
      observer = new ResizeObserver(() => view.invalidateSize());
      observer.observe(container.current);
    }).catch(() => { if (mounted) { setLoading(false); setError('Map unavailable. Retry, or use the place list or coordinates.'); } });
    return () => { mounted = false; observer?.disconnect(); map.current?.remove(); map.current = null; marker.current = null; };
  }, [googleKey, attempt]);
  const serializedPins = JSON.stringify(pins ?? []);
  useEffect(() => {
    const L = leaflet.current;
    const view = map.current;
    if (!ready || !L || !view) return;
    const points: MapPin[] = JSON.parse(serializedPins);
    if (!points.length) return;
    framePins(L, view, points);
    return addPins(L, view, points, id => { void latest.current.onSelectVenue?.(id); });
  }, [ready, serializedPins]);
  const lat = point?.[0];
  const lng = point?.[1];
  useEffect(() => {
    if (!map.current || !marker.current) return;
    if (lat === undefined || lng === undefined) { marker.current.remove(); return; }
    marker.current.setLatLng([lat, lng]).addTo(map.current);
    map.current.panTo([lat, lng], { animate: false });
  }, [lat, lng, ready]);
  return <div className="barkits-map"
    style={{ '--map-ink': palette.ink, '--map-surface': palette.paper, '--map-pin': palette.plum,
      '--map-origin': palette.coral, '--map-edge': palette.cream, '--map-error': colors.error,
      '--map-error-surface': colors.errorSurface, '--map-shadow': colors.scrim,
      position: 'relative', zIndex: 0, width: '100%', height: viewportHeight, display: 'flex', flexDirection: 'column',
    } as CSSProperties}>
    <div style={{ position: 'relative', flex: viewportHeight ? 1 : undefined, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div ref={container} aria-label={mapLabel ?? (onSelectVenue ? 'Suggested places map' : 'Location map')} style={{ height: viewportHeight ? undefined : onSelectVenue ? 300 : 240, flex: viewportHeight ? 1 : undefined, minHeight: 0, width: '100%', borderRadius: viewportHeight ? 0 : radius.control }} />
      {onExpand && <button type="button" className="map-expand" aria-label="Open full-screen map" title="Open full-screen map" onClick={() => void onExpand()}>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 3H3v4m10-4h4v4M3 13v4h4m10-4v4h-4" />
        </svg>
      </button>}
    </div>
    {googleKey && ready && map.current && leaflet.current && <GoogleRoadmap map={map.current} leaflet={leaflet.current} apiKey={googleKey} />}
    {!googleKey && <div className="map-attribution">
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
      {loading && <span role="status">Loading map…</span>}
    </div>}
    {error && <div className="map-feedback" role="status" style={{ padding: spacing.sm }}>
      <span>{error}</span><button type="button" onClick={() => setAttempt(value => value + 1)}>Retry map</button>
    </div>}
  </div>;
}
