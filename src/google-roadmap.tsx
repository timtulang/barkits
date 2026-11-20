import type * as Leaflet from 'leaflet';
import { useEffect, useState } from 'react';

const baseUrl = 'https://tile.googleapis.com/v1';
const viewportUrl = 'https://tile.googleapis.com/tile/v1/viewport';

async function readResponse(response: Response) {
  if (response.ok) return response.json();
  if (response.status === 429) throw new Error('Google Maps has reached its request limit. Try again later.');
  if (response.status === 403) throw new Error('Google Maps is unavailable for this site. Check the preview key and its restrictions.');
  throw new Error('Google Maps could not load. Check your connection and try again.');
}

function viewportParams(map: Leaflet.Map, session: string, key: string) {
  const bounds = map.getBounds();
  const wholeWorld = bounds.getEast() - bounds.getWest() >= 360;
  return new URLSearchParams({
    key, session, zoom: String(map.getZoom()),
    north: String(bounds.getNorth()), south: String(bounds.getSouth()),
    west: String(wholeWorld ? -180 : bounds.getNorthWest().wrap().lng),
    east: String(wholeWorld ? 180 : bounds.getSouthEast().wrap().lng),
  });
}

export function GoogleRoadmap({ map, leaflet, apiKey }: { map: Leaflet.Map; leaflet: typeof Leaflet; apiKey: string }) {
  const [credits, setCredits] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const sessionRequest = new AbortController();
    let viewportRequest: AbortController | undefined;
    let tiles: Leaflet.TileLayer | undefined;
    let session = '';
    let stopped = false;
    setCredits('');
    setError('');

    function stop() {
      stopped = true;
      sessionRequest.abort();
      viewportRequest?.abort();
      map.off('moveend resize', updateViewport);
      tiles?.off('tileerror', tileError);
      tiles?.remove();
    }
    function fail(problem: unknown) {
      if (stopped) return;
      stop();
      setCredits('');
      setError(problem instanceof TypeError || !(problem instanceof Error)
        ? 'Google Maps could not load. Check your connection and try again.' : problem.message);
    }
    function tileError() {
      fail(new Error('Google map tiles could not load. Check your connection or the project’s tile quota.'));
    }
    async function updateViewport() {
      viewportRequest?.abort();
      const request = new AbortController();
      viewportRequest = request;
      try {
        const response = await fetch(viewportUrl + '?' + viewportParams(map, session, apiKey), { signal: request.signal });
        const data = await readResponse(response);
        if (request.signal.aborted) return;
        if (typeof data.copyright !== 'string' || !data.copyright.trim()) throw new Error('Google Maps attribution is unavailable.');
        setCredits(data.copyright);
        if (!tiles) {
          const params = new URLSearchParams({ key: apiKey, session });
          tiles = leaflet.tileLayer(baseUrl + '/2dtiles/{z}/{x}/{y}?' + params, {
            maxZoom: 19, updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 0,
          }).on('tileerror', tileError).addTo(map);
        }
      } catch (problem) {
        if (!request.signal.aborted) fail(problem);
      }
    }
    async function start() {
      const response = await fetch(baseUrl + '/createSession?' + new URLSearchParams({ key: apiKey }), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapType: 'roadmap', language: 'en-US', region: 'PH' }), signal: sessionRequest.signal,
      });
      const data = await readResponse(response);
      if (stopped) return;
      if (typeof data.session !== 'string' || !data.session) throw new Error('Google Maps could not start a map session.');
      session = data.session;
      map.on('moveend resize', updateViewport);
      await updateViewport();
    }
    void start().catch(fail);
    return stop;
  }, [map, leaflet, apiKey, attempt]);

  if (error) return <div role="status">{error} <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry map</button></div>;
  return <div style={{ background: '#fff', display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, padding: '10px 10px 5px' }}>
    <img src="/google-maps-attribution.svg" alt="Google Maps" height={16} />
    <span style={{ font: '12px sans-serif' }}>{credits || 'Loading map…'}</span>
  </div>;
}
