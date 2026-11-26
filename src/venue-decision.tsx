import { useState } from 'react';
import { DecisionActions } from './decision-actions';
import type { Meetup, Participant, Venue } from './planner';

export function VenueDecision({ meetup, venue, voter, save }: {
  meetup: Meetup; venue: Venue; voter: Participant; save: (meetup: Meetup) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const current = meetup.votes[voter.id];
  function vote() {
    const votes = { ...meetup.votes };
    if (current === venue.id) delete votes[voter.id];
    else votes[voter.id] = venue.id;
    save({ ...meetup, votes });
  }
  return <DecisionActions place={venue.name} count={Object.values(meetup.votes).filter(id => id === venue.id).length}
    voter={voter.name} votedHere={current === venue.id} hasVote={!!current} vote={vote}
    confirming={confirming} review={setConfirming} confirm={() => save({ ...meetup, venue: venue.id, status: 'Decided' })} />;
}
