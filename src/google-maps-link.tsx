import { useState } from 'react';
import { Linking } from 'react-native';
import type { Point } from './geo';
import { Button, Label } from './ui';

export function GoogleMapsLink({ point, directions = false }: { point: Point; directions?: boolean }) {
  const [error, setError] = useState(false);
  async function open() {
    setError(false);
    try {
      const path = directions ? 'dir/?api=1&destination=' : 'search/?api=1&query=';
      await Linking.openURL('https://www.google.com/maps/' + path + encodeURIComponent(point.join(',')));
    } catch {
      setError(true);
    }
  }
  return <>
    <Button quiet={!directions} onPress={open} icon={directions ? 'navigation' : 'external-link'}>{directions ? 'Get directions' : 'Open in Google Maps'}</Button>
    {error && <Label>Couldn’t open Google Maps. Try again.</Label>}
  </>;
}
