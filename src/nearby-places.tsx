import { canConfirmLocal } from './destination-eligibility';
import type { MapNavigation } from './fullscreen-place-map';
import { FriendPicker } from './friend-picker';
import { SuggestedPlaces } from './suggested-places';
import type { ReactNode } from 'react';
import type { LocatedFriend, discover } from './discovery';
import { type Meetup, type Participant, type Venue, retainPlace, venues } from './planner';
import { localTripRows } from './trip-evidence';
import { TripComparison } from './trip-comparison';
import { Label } from './ui';
import { VenueDecision } from './venue-decision';

type Props = {
  navigation: MapNavigation; meetup: Meetup; voter?: Participant; friends: LocatedFriend[]; suggestions: ReturnType<typeof discover>;
  filters: ReactNode; selected?: string; selectVoter: (id: string) => void; editTrip: (venue: Venue, person: string) => void;
  editFriend: (person?: Participant) => void; save: (meetup: Meetup) => void; select: (venue: Venue) => void;
};

export function NearbyPlaces({ meetup, voter, friends, suggestions, filters, selectVoter, editTrip, editFriend, save, navigation, selected, select }: Props) {
  return <SuggestedPlaces navigation={navigation} suggestions={suggestions} friends={friends}
    alternatives={[...meetup.customVenues ?? [], ...venues]} filters={filters} actions={(venue, close) => {
      const ready = canConfirmLocal(retainPlace(meetup, venue), venue);
      const hasLimits = meetup.participants.some(person => person.budget !== undefined || person.maxMinutes !== undefined);
      const choose = () => { close(); select(venue); };
      return <>
        {voter && <>
          {!ready && <Label kind="detail">{hasLimits ? 'Check the group’s travel limits before voting.' : 'Add trip estimates to vote.'}</Label>}
          <TripComparison rows={localTripRows(meetup, venue)} editableIds={meetup.participants.map(person => person.id)}
            edit={person => { close(); editTrip(venue, person); }}
            changeTransport={id => { close(); editFriend(meetup.participants.find(person => person.id === id)); }} />
          <FriendPicker label="Vote as" people={meetup.participants} selected={voter.id} change={selectVoter} />
          <VenueDecision meetup={meetup} venue={venue} voter={voter} save={updated => save(retainPlace(updated, venue))}
            select={choose} selected={selected === venue.id} voteDisabled={!ready} />
        </>}
      </>;
    }} />;
}
