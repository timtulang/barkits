import { useState } from 'react';
import { Linking } from 'react-native';
import type { Point } from './geo';
import { Button, Label } from './ui';

export function GoogleMapsLink({ point }: { point: Point }) {
  const [error, setError] = useState(false);
  async function open() {
    setError(false);
    try {
      await Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(point.join(',')));
    } catch {
      setError(true);
    }
  }
  return <>
    <Button quiet onPress={open} icon="external-link">Open in Google Maps</Button>
    {error && <Label>Couldn’t open Google Maps. Try again.</Label>}
  </>;
}
