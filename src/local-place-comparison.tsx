import { View } from 'react-native';
import { type Meetup, type Participant, type Ranking, type Venue, rankings, recommend, venues } from './planner';
import { localTripRows, summarizeTrips } from './trip-evidence';
import { TripComparison } from './trip-comparison';
import { VenueDecision } from './venue-decision';
import { Button, Chip, Label, layout, Panel } from './ui';

const explanations: Record<Ranking, string> = {
  Balanced: 'Balances average time, differences between people’s trips, and fare.',
  Fastest: 'Lowest combined travel time for the group.', Fairest: 'Smallest gap between the longest and shortest trip.',
  Cheapest: 'Lowest combined fare; every person needs a fare.',
};

export function LocalPlaceComparison({ meetup, ranking, setRanking, voter, editTrip, editPerson, save, selected, review }: {
  meetup: Meetup; ranking: Ranking; setRanking: (ranking: Ranking) => void; voter?: Participant; selected?: string;
  editTrip: (venue: string, person?: string) => void; editPerson: (person: Participant) => void; save: (meetup: Meetup) => void;
  review: (venue: Venue) => void;
}) {
  const ranked = recommend(meetup.participants, ranking, meetup.manualFares, meetup.customVenues, meetup.manualMinutes);
  const order = new Map(ranked.map((item, i) => [item.venue.id, i]));
  const places = [...venues, ...meetup.customVenues ?? []].sort((a, b) => {
    if (a.id === selected) return -1;
    if (b.id === selected) return 1;
    return (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity);
  });
  const limited = meetup.participants.some(person => person.budget !== undefined || person.maxMinutes !== undefined);
  return <View style={layout.stack}>
    <Label kind="item" heading>Compare meeting places</Label>
    <Label kind="detail">Same people, same transport choices, different destinations. Times and fares are demo figures or estimates you enter, not live quotes.</Label>
    <View style={layout.wrap}>{rankings.map(item => <Chip key={item} selected={ranking === item} onPress={() => setRanking(item)}>{item}</Chip>)}</View>
    <Label kind="detail">{explanations[ranking]} Incomplete or over-limit places stay visible below so you can fix them.</Label>
    {!meetup.participants.length && <Label>Add a friend in Who before comparing trips.</Label>}
    {places.map(venue => {
      const rows = localTripRows(meetup, venue);
      const totals = summarizeTrips(rows);
      const position = order.get(venue.id);
      const unranked = !limited && meetup.customVenues?.some(item => item.id === venue.id) && totals.ready < totals.count;
      return <Panel key={venue.id}>
        <View style={layout.wrap}><Label kind="item" heading>{venue.name}</Label>{position === 0 && <Chip selected>Top match · {ranking}</Chip>}</View>
        <Label kind="detail">{venue.area}{selected === venue.id ? ' · Selected for comparison' : ''}</Label>
        {position === undefined && <Label kind="detail">{totals.blocked ? 'Outside a travel limit or missing a required estimate.' :
          totals.ready < totals.count ? 'Not ranked yet: enter missing travel times.' : 'Not ranked: this ranking needs complete fares.'}</Label>}
        <TripComparison rows={rows} editableIds={meetup.participants.map(person => person.id)}
          edit={person => editTrip(venue.id, person)} changeTransport={id => editPerson(meetup.participants.find(person => person.id === id)!)} />
        <Button secondary onPress={() => editTrip(venue.id)}>Enter or check trip estimates here</Button>
        {voter && (position !== undefined || unranked) && <VenueDecision meetup={meetup} venue={venue} voter={voter} save={save} onReview={review} />}
        {voter && position === undefined && !unranked && <Button quiet onPress={() => review(venue)}>Review place &amp; limits</Button>}
      </Panel>;
    })}
  </View>;
}
