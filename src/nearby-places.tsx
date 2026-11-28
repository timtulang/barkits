import { canConfirmLocal } from './destination-eligibility';
import type { MapNavigation } from './fullscreen-place-map';
import { FriendPicker } from './friend-picker';
import { SuggestedPlaces, type PlaceBrowseView } from './suggested-places';
import type { ReactNode } from 'react';
import type { LocatedFriend, discover } from './discovery';
import { type Meetup, type Participant, type Ranking, type Venue, retainPlace, venues } from './planner';
import { PlaceRankings } from './place-rankings';
import { localTripRows } from './trip-evidence';
import { TripComparison } from './trip-comparison';
import { Label } from './ui';
import { VenueDecision } from './venue-decision';

type Props = {
  navigation: MapNavigation; meetup: Meetup; voter?: Participant; friends: LocatedFriend[]; suggestions: ReturnType<typeof discover>;
  filters: ReactNode; selected?: string; selectVoter: (id: string) => void; editTrip: (venue: Venue, person: string) => void;
  editFriend: (person?: Participant) => void; save: (meetup: Meetup) => void; select: (venue: Venue) => void;
  view: PlaceBrowseView; changeView: (view: PlaceBrowseView) => void;
  ranking: Ranking; changeRanking: (ranking: Ranking) => void;
};

export function NearbyPlaces({ meetup, voter, friends, suggestions, filters, selectVoter, editTrip, editFriend, save, navigation,
  selected, select, view, changeView, ranking, changeRanking }: Props) {
  return <SuggestedPlaces navigation={navigation} suggestions={suggestions} friends={friends}
    browser={{ view, change: changeView, extra: { id: 'compare', label: 'Compare', render: (places, open) =>
      <PlaceRankings meetup={meetup} places={places} open={open} selected={selected} ranking={ranking} changeRanking={changeRanking} /> } }}
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
