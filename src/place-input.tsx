import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { parsePoint } from './geo';
import PlaceMap from './place-map';
import { detectPoint } from './services/device-location';
import { Button, Field, Label, layout } from './ui';

export function PlaceInput({ name, setName, coordinates, setCoordinates, destination = false }: {
  name: string; setName: (value: string) => void; coordinates: string; setCoordinates: (value: string) => void; destination?: boolean;
}) {
  const [showMap, setShowMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');
  const serial = useRef(0);
  useEffect(() => () => { serial.current++; }, []);
  function edit(value: string) {
    serial.current++;
    setLocating(false);
    setMessage('');
    setCoordinates(value);
  }
  async function detect() {
    const request = ++serial.current;
    setLocating(true);
    setMessage('');
    try {
      const point = await detectPoint();
      if (request === serial.current) {
        setCoordinates(point.map(value => value.toFixed(5)).join(', '));
        setMessage('Location found. Check the coordinates before saving.');
      }
    } catch (error) {
      if (request === serial.current) setMessage(error instanceof Error ? error.message : 'Location unavailable.');
    } finally {
      if (request === serial.current) setLocating(false);
    }
  }
  return <View style={layout.stack}>
    <Field label={destination ? 'Meeting place' : 'Starting place'} placeholder="Landmark, address, or city" value={name} onChange={setName} />
    <Field label="Coordinates (optional)" placeholder="Latitude, longitude" value={coordinates} onChange={edit} />
    <View style={layout.wrap}>
      {!destination && <Button secondary icon="crosshair" disabled={locating} onPress={detect}>{locating ? 'Finding location…' : 'Use my location'}</Button>}
      <Button secondary icon="map" onPress={() => setShowMap(!showMap)}>{showMap ? 'Hide map' : 'Choose on map'}</Button>
    </View>
    {!!message && <Label>{message}</Label>}
    {showMap && <><Label size={13}>Tap the map to drop a pin. OpenStreetMap supplies tiles for the area you view.</Label>
      <PlaceMap point={parsePoint(coordinates)} onPick={async point => edit(point.map(value => value.toFixed(5)).join(', '))}
        dom={{ style: { height: 275 }, scrollEnabled: false, applicationNameForUserAgent: 'Barkits/0.1' }} /></>}
  </View>;
}
