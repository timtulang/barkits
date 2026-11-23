import { useState } from 'react';
import { Linking, View } from 'react-native';
import { compareRideFares, lrtFare, lrtFareSource, lrtStations, rideProviders, transitUrl, validFare, type RideProvider } from './transport-fares';
import { Button, Chip, Field, Label, layout } from './ui';
import { palette, radius, spacing } from './theme';
import { parsePoint } from './geo';
import { railConnection } from './rail-connection';

function StationField({ label, value, change }: { label: string; value: string; change: (station: string) => void }) {
  const [search,setSearch] = useState('');
  const [open,setOpen] = useState(false);
  const matches = lrtStations.filter(s => s.toLowerCase().includes(search.trim().toLowerCase()));
  return <View style={layout.stack}>
    <Button secondary onPress={() => { setOpen(!open); setSearch(''); }}>{label}{value ? ' · ' + value : ''}</Button>
    {open && <><Field label={'Search ' + label.toLowerCase()} value={search} onChange={setSearch} placeholder="Station name" />
      <View style={layout.wrap}>{matches.map(station => <Chip key={station} selected={value === station}
        onPress={() => { change(station); setOpen(false); }}>{station}</Chip>)}</View>
      {!matches.length && <Label>No station matches that name.</Label>}</>}
  </View>;
}
const websites = { Angkas: 'https://www.angkas.com/services/passenger', Grab: 'https://www.grab.com/ph/transport/' };
export function TripOptions({ origin, destination, walking, onUse, currentProvider, currentFare }: {
  origin: string; destination: string; walking?: boolean; currentProvider?: RideProvider; currentFare: string;
  onUse: (provider: RideProvider, fare: string) => void;
}) {
  const [tab,setTab] = useState<'rides' | 'rail'>();
  const connection = railConnection(parsePoint(origin), parsePoint(destination));
  const [from,setFrom] = useState(connection?.boarding.name ?? '');
  const [to,setTo] = useState(connection?.exit.name ?? '');
  const [quotes,setQuotes] = useState({ Angkas: currentProvider === 'Angkas' ? currentFare : '', Grab: currentProvider === 'Grab' ? currentFare : '' });
  const [error,setError] = useState('');
  async function visit(url: string) {
    setError('');
    try { await Linking.openURL(url); }
    catch { setError('Couldn’t open the link. Check your connection and try again.'); }
  }
  const fare = lrtFare(from, to);
  const comparison = compareRideFares(quotes.Angkas, quotes.Grab);
  return <View style={layout.stack}>
    <Label kind="item" heading>Check your trip</Label>
    {connection && !walking && <View style={{ backgroundColor: palette.mint, borderRadius: radius.control, padding: spacing.md, gap: spacing.xs }}>
      <Label weight="bold">Possible LRT-1 trip · ₱{connection.fare} rail fare</Label>
      <Label>Board at {connection.boarding.name} · Toward {connection.toward}</Label>
      <Label>Get off at {connection.exit.name}</Label>
      <Label kind="detail">Straight-line distance to the train is {connection.boarding.distance.toFixed(1)} km from your start and {connection.exit.distance.toFixed(1)} km from your destination. Check access and service in transit directions.</Label>
    </View>}
    <Label size={14} color={palette.muted}>Directions open in Google Maps with this starting point and destination.</Label>
    <View style={layout.wrap}>
      <Button secondary icon={walking ? 'navigation' : 'map'} onPress={() => visit(transitUrl(origin,destination,walking))}>{walking ? 'Walking directions' : 'Transit directions'}</Button>
      <Chip selected={tab === 'rail'} onPress={() => setTab(tab === 'rail' ? undefined : 'rail')}>LRT-1 fares</Chip>
      <Chip selected={tab === 'rides'} onPress={() => setTab(tab === 'rides' ? undefined : 'rides')}>Compare ride fares</Chip>
    </View>
    {tab === 'rail' && <>
      <Label weight="bold">LRT-1 single-journey ticket</Label>
      <StationField label="Boarding station" value={from} change={setFrom} />
      <StationField label="Exit station" value={to} change={setTo} />
      {from && to && <Label weight="bold">{fare === undefined ? 'Choose two different stations.' : '₱' + fare + ' · ' + from + ' to ' + to}</Label>}
      <Label kind="detail">Rail leg only. Add any jeepney, bus, or other connecting fares to your one-way total.</Label>
      <Button secondary icon="external-link" onPress={() => visit(lrtFareSource)}>LRMC fare matrix · April 2, 2025</Button>
    </>}
    {tab === 'rides' && <>
      <Label kind="detail">Check the same pickup and destination in the Angkas and Grab apps, then enter the prices here. Only the fare you choose is saved with your trip.</Label>
      {rideProviders.map(provider => <View key={provider} style={layout.stack}>
        <Field label={provider + ' app price (₱)'} inputMode="decimal" value={quotes[provider]} onChange={text => setQuotes(q => ({ ...q, [provider]: text }))} />
        <View style={layout.wrap}><Button secondary icon="external-link" onPress={() => visit(websites[provider])}>{provider} website</Button>
          <Button secondary disabled={!validFare(quotes[provider])} onPress={() => onUse(provider,quotes[provider].trim())}>Use {provider} fare</Button></View>
      </View>)}
      {comparison && <Label weight="bold">{comparison}</Label>}
    </>}
    {currentProvider && <Label size={14}>Selected fare · {currentProvider} · entered by you</Label>}
    {!!error && <View accessibilityRole="alert"><Label>{error}</Label></View>}
  </View>;
}
