import { VenueSummary } from './venue-summary';
import { Linking, View } from 'react-native';
import type { LocatedFriend, Category, discover } from './discovery';
import { Meetup, Participant, Venue, retainPlace } from './planner';
import { Button, Chip, Label, layout, Panel } from './ui';
import { GoogleMapsLink } from './google-maps-link';
import { VenueDecision } from './venue-decision';

type Props = {
  meetup: Meetup; voter?: Participant; friends: LocatedFriend[]; suggestions: ReturnType<typeof discover>;
  category: Category; edit: (friend: Participant) => void;
  compare: (venue: Venue) => void; save: (meetup: Meetup) => void;
};

export function NearbyPlaces({ meetup, voter, friends, suggestions, category, edit, compare, save }: Props) {
  const missing = meetup.participants.filter(person => !friends.some(friend => friend.id === person.id));
  const hasLimits = meetup.participants.some(person => person.budget !== undefined || person.maxMinutes !== undefined);
  return <>
    {!meetup.participants.length ? <Label>Add a friend and their starting point to find places.</Label> :
      missing.length ? <Panel><Label>Choose a locality match or pin for each starting point to calculate suggestions.</Label>
        <View style={layout.wrap}>{missing.map(friend => <Button key={friend.id} secondary onPress={() => edit(friend)}>Locate {friend.name}</Button>)}</View></Panel> :
      !suggestions.length ? <Label>No mapped {category === 'All' ? 'places' : category.toLowerCase() + ' venues'} in this catalog are within 50 km of every starting point. Try another category or suggest your own place.</Label> :
      <Label kind="detail">Places are ranked by distance from your group, with extra weight on the longest trip and nearby bus connections.</Label>}
    {suggestions.map(({ venue, distances, nearBus }) => <Panel key={venue.id}>
      <VenueSummary name={venue.name} location={[venue.category, venue.area].filter(Boolean).join(' · ')} friends={friends} distances={distances} />
      {nearBus && <Label kind="detail">Within 800 m of a mapped bus terminal.</Label>}
      {hasLimits && <Label>Enter trips to check this place against the group’s travel limits.</Label>}
      <View style={layout.wrap}>
        <Button secondary onPress={() => compare(venue)}>Compare trips here</Button>
        {venue.point && <GoogleMapsLink point={venue.point} />}
      </View>
      {!hasLimits && voter && <VenueDecision meetup={meetup} venue={venue} voter={voter} save={updated => save(retainPlace(updated, venue))} />}
    </Panel>)}
    {suggestions.length > 0 && <Chip onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')}>Venue data © OpenStreetMap contributors</Chip>}
  </>;
}
