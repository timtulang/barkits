import { useState } from 'react';
import { View } from 'react-native';
import { Meetup, Participant, Venue } from './planner';
import { Button, Label, layout } from './ui';

export function VenueDecision({ meetup, venue, voter, save }: {
  meetup: Meetup; venue: Venue; voter: Participant; save: (meetup: Meetup) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const votes = Object.values(meetup.votes).filter(id => id === venue.id).length;
  return <>
    <View style={layout.wrap}>
      <Button secondary onPress={() => save({ ...meetup, votes: { ...meetup.votes, [voter.id]: venue.id } })}>
        {meetup.votes[voter.id] === venue.id ? 'Voted' : 'Vote'} · {votes}
      </Button>
      <Button onPress={() => setConfirm(true)}>Choose this spot</Button>
    </View>
    {confirm && <><Label weight="bold">Finalize {venue.name} for this meetup?</Label><View style={layout.wrap}>
      <Button onPress={() => save({ ...meetup, venue: venue.id, status: 'Decided' })}>Finalize location</Button>
      <Button secondary onPress={() => setConfirm(false)}>Cancel</Button>
    </View></>}
  </>;
}
