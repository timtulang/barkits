import { searchLandmarks } from './venue-catalog';
import { searchPlaces } from './place-search';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { parsePoint } from './geo';
import PlaceMap from './place-map';
import { detectPoint } from './services/device-location';
import { Button, Chip, Field, Label, layout } from './ui';

export function PlaceInput({ name, setName, coordinates, setCoordinates, destination = false }: {
  name: string; setName: (value: string) => void; coordinates: string; setCoordinates: (value: string) => void; destination?: boolean;
}) {
  const [searching, setSearching] = useState(false);
  const matches = searching ? searchPlaces(name) : [];
  const landmarks = searching ? searchLandmarks(name) : [];
  const [showMap, setShowMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');
  const serial = useRef(0);
  const pinHasLabel = useRef(Boolean(name.trim() && coordinates.trim()));
  useEffect(() => () => { serial.current++; }, []);
  function edit(value: string) {
    serial.current++;
    setLocating(false);
    setMessage('');
    pinHasLabel.current = Boolean(name.trim() && value.trim());
    setCoordinates(value);
  }
  async function detect() {
    const request = ++serial.current;
    setLocating(true);
    setMessage('');
    try {
      const point = await detectPoint();
      if (request === serial.current) {
        pinHasLabel.current = Boolean(name.trim());
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
    <Field label={destination ? 'Meeting place' : 'Starting place'} placeholder="Landmark, address, or city" value={name} onChange={text => {
      if (pinHasLabel.current || locating) edit('');
      setName(text);
      setSearching(true);
    }} />
    {matches.length > 0 && <><Label size={13}>Philippine places · GeoNames locality centers</Label>
      <View style={layout.wrap}>{matches.map(place => <Chip key={place.point.join()} onPress={() => {
        setName(place.name + ', ' + place.province);
        edit(place.point.join(', '));
        setSearching(false);
      }}>{place.name} · {place.province}</Chip>)}</View></>}
    {landmarks.length > 0 && <><Label size={13}>Mapped landmarks · © OpenStreetMap contributors</Label>
      <View style={layout.wrap}>{landmarks.map(([id, title, city, , lat, lng]) => <Chip key={id} onPress={() => {
        setName([title, city].filter(Boolean).join(', '));
        edit([lat, lng].join(', '));
        setSearching(false);
      }}>{title} · {city || 'Philippines'}</Chip>)}</View></>}
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
