import type { MapNavigation } from './fullscreen-place-map';
import { SuggestedPlaces } from './suggested-places';
import { Linking, View } from 'react-native';
import type { LocatedFriend, Category, discover } from './discovery';
import { Meetup, Participant, Venue, retainPlace } from './planner';
import { Button, Chip, Label, layout, Panel } from './ui';
import { VenueDecision } from './venue-decision';

type Props = {
  navigation: MapNavigation; meetup: Meetup; voter?: Participant; friends: LocatedFriend[]; suggestions: ReturnType<typeof discover>;
  category: Category; edit: (friend: Participant) => void;
  compare: (venue: Venue) => void; save: (meetup: Meetup) => void;
};

export function NearbyPlaces({ meetup, voter, friends, suggestions, category, edit, compare, save, navigation }: Props) {
  const missing = meetup.participants.filter(person => !friends.some(friend => friend.id === person.id));
  const hasLimits = meetup.participants.some(person => person.budget !== undefined || person.maxMinutes !== undefined);
  return <>
    {!meetup.participants.length ? <Label>Add a friend and their starting point to find places.</Label> :
      missing.length ? <Panel><Label>Choose a locality match or pin for each starting point to calculate suggestions.</Label>
        <View style={layout.wrap}>{missing.map(friend => <Button key={friend.id} secondary onPress={() => edit(friend)}>Locate {friend.name}</Button>)}</View></Panel> :
      !suggestions.length ? <Label>No mapped {category === 'All' ? 'places' : category.toLowerCase() + ' venues'} in this catalog are within 50 km of every starting point. Try another category or suggest your own place.</Label> : null}
    <SuggestedPlaces navigation={navigation} suggestions={suggestions} friends={friends} actions={venue => <>
      {hasLimits && <Label>Enter trips to check this place against the group’s travel limits.</Label>}
      <Button secondary onPress={() => compare(venue)}>Compare trips here</Button>
      {!hasLimits && voter && <VenueDecision meetup={meetup} venue={venue} voter={voter} save={updated => save(retainPlace(updated, venue))} />}
    </>} />
    {suggestions.length > 0 && <Label kind="detail">Ranked by distance from your group, with extra weight on the longest trip and nearby bus connections.</Label>}
    {suggestions.length > 0 && <Chip onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')}>Venue data © OpenStreetMap contributors</Chip>}
  </>;
}
