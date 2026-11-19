import { useState } from 'react';
import { Linking, View } from 'react-native';
import { Kits } from './kits';
import { Meetup, Participant, Ranking, rankings, ratingSummary, recommend, venues } from './planner';
import { palette } from './theme';
import { Button, Chip, Field, Icon, Label, layout, Panel } from './ui';

const rankingDescriptions: Record<Ranking, string> = {
  Balanced: 'Balances group travel time, similar trip lengths, and fare.',
  Fairest: 'Prioritizes similar trip lengths across the group.',
  Fastest: 'Prioritizes the lowest combined travel time.',
  Cheapest: 'Prioritizes the lowest combined fare when all fares are available.',
};

export function MeetupScreen({ meetup, save, editFriend, back }: {
  meetup: Meetup; save: (meetup: Meetup) => void; editFriend: (friend?: Participant) => void; back: () => void;
}) {
  const [ranking, setRanking] = useState<Ranking>('Balanced');
  const [expanded, setExpanded] = useState('');
  const [voter, setVoter] = useState('');
  const [caption, setCaption] = useState(meetup.recap ?? '');
  const [confirmVenue, setConfirmVenue] = useState('');
  const [linkError, setLinkError] = useState('');
  const venue = venues.find(item => item.id === meetup.venue);
  const currentVoter = meetup.participants.find(friend => friend.id === voter) ?? meetup.participants[0];
  const canRate = meetup.status === 'Completed';
  const ratings = ratingSummary(meetup.ratings);
  const candidates = recommend(meetup.participants, ranking, meetup.manualFares);
  function rate(value: number | null) {
    if (!currentVoter) return;
    const next = { ...meetup.ratings };
    if (value === null) delete next[currentVoter.id];
    else next[currentVoter.id] = value;
    save({ ...meetup, ratings: next });
  }
  async function openDirections() {
    if (!venue) return;
    try {
      await Linking.openURL(`https://www.openstreetmap.org/?mlat=${venue.point[0]}&mlon=${venue.point[1]}#map=17/${venue.point.join('/')}`);
      setLinkError('');
    } catch {
      setLinkError('Couldn’t open the map.');
    }
  }
  return <>
    <Button secondary onPress={back} icon="arrow-left">Back to meetups</Button>
    <View style={{ gap: 6 }}><View style={layout.wrap}><Label size={40} weight="title">{meetup.name}</Label><Chip selected>{meetup.status}</Chip></View>
      <Label color={palette.muted}>{meetup.date || 'Date to be decided'} · Local demo</Label></View>
    <Panel>
      <View style={layout.between}><Label size={23} weight="title">Your barkada</Label>{meetup.status === 'Planning' && <Button secondary icon="user-plus" onPress={() => editFriend()}>Add friend</Button>}</View>
      {meetup.participants.length === 0 && <View style={layout.row}><Kits style={{ width: 85, height: 58, borderRadius: 10 }} /><Label color={palette.muted}>Add friends to compare meetup spots.</Label></View>}
      {meetup.participants.map(friend => <View key={friend.id} style={layout.between}><View style={{ flex: 1 }}><Label><Label weight="bold">{friend.name}</Label> · {friend.origin} · {friend.mode}{friend.budget === undefined ? '' : ` · ₱${friend.budget} limit`}{friend.maxMinutes === undefined ? '' : ` · ${friend.maxMinutes} min limit`}</Label></View>{meetup.status === 'Planning' && <Chip onPress={() => editFriend(friend)}>Edit {friend.name}</Chip>}</View>)}
    </Panel>
    {meetup.status === 'Planning' && <>
      <View style={layout.stack}>
        <Label size={28} weight="title">Compare meetup spots</Label>
        <Label color={palette.muted}>Demo routes and fares. Values are illustrative and include no live traffic.</Label>
        <View style={layout.wrap}>{rankings.map(item => <Chip key={item} selected={ranking === item} onPress={() => setRanking(item)}>{item}</Chip>)}</View>
        {!!currentVoter && <><Label weight="bold">Vote as</Label><View style={layout.wrap}>
          {meetup.participants.map(friend => <Chip key={friend.id} selected={currentVoter.id === friend.id} onPress={() => setVoter(friend.id)}>{friend.name}</Chip>)}
        </View></>}
      </View>
      {currentVoter?.mode === 'Motorcycle taxi' && <Panel>
        <Label weight="title" size={19}>Enter a fare for {currentVoter.name}</Label>
        <Label color={palette.muted}>Add a fare you checked yourself. Barkits labels it as user-entered.</Label>
        <View style={layout.stack}>{venues.map(item => <FareField
          key={`${item.id}:${currentVoter.id}`} label={item.name}
          saved={meetup.manualFares?.[item.id]?.[currentVoter.id]}
          onSave={value => {
            const fares = { ...meetup.manualFares?.[item.id] };
            if (value === undefined) delete fares[currentVoter.id];
            else fares[currentVoter.id] = value;
            save({ ...meetup, manualFares: { ...meetup.manualFares, [item.id]: fares } });
          }}
        />)}</View>
      </Panel>}
      {!!meetup.participants.length && !candidates.length && <Panel><Label>No demo routes meet these limits or provide the data required for this ranking.</Label></Panel>}
      {candidates.map(({ venue: item, journeys, time, spread, cost }, index) => {
        const votes = Object.values(meetup.votes).filter(id => id === item.id).length;
        const voted = !!currentVoter && meetup.votes[currentVoter.id] === item.id;
        return <Panel key={item.id}>
          <View style={layout.between}><View style={layout.row}><View style={{ backgroundColor: palette[item.color], padding: 10, borderRadius: 12 }}><Icon name={item.icon} /></View>
            <View style={{ flexShrink: 1 }}><Label size={20} weight="title">{item.name}</Label><Label size={13} color={palette.muted}>{item.area}</Label></View></View>
            {index === 0 && <Chip selected>Top match</Chip>}</View>
          {index === 0 && <Label color={palette.muted}>{rankingDescriptions[ranking]}</Label>}
          <Label>{time} min total · {spread} min difference · {cost === null ? 'Total fare unavailable' : `₱${cost} total${journeys.some(journey => journey.manual) ? ' · includes user-entered fares' : ''}`}</Label>
          {expanded === item.id && journeys.map(({ participant, minutes, fare, manual }) => <Label key={participant.id}>{participant.name} · {participant.mode} · {minutes} min · {fare === null ? 'Fare unavailable' : `₱${fare} ${manual ? 'user-entered fare' : 'demo fare'}`}</Label>)}
          <View style={layout.wrap}>
            <Button secondary onPress={() => setExpanded(expanded === item.id ? '' : item.id)}>{expanded === item.id ? 'Hide trips' : 'View trips'}</Button>
            <Button secondary onPress={() => currentVoter && save({ ...meetup, votes: { ...meetup.votes, [currentVoter.id]: item.id } })}>{voted ? 'Voted' : 'Vote'} · {votes}</Button>
            <Button onPress={() => setConfirmVenue(item.id)}>Choose this spot</Button>
          </View>
          {confirmVenue === item.id && <><Label weight="bold">Finalize {item.name} for this meetup?</Label><View style={layout.wrap}>
            <Button onPress={() => save({ ...meetup, venue: item.id, status: 'Decided' })}>Finalize location</Button>
            <Button secondary onPress={() => setConfirmVenue('')}>Cancel</Button>
          </View></>}
        </Panel>;
      })}
    </>}
    {!!venue && <Panel><Label size={23} weight="title">Meet at {venue.name}</Label><Label>{venue.area}</Label>
      <View style={layout.wrap}>
        <Button secondary onPress={openDirections} icon="external-link">Open venue map</Button>
        {meetup.status === 'Decided' && <Button onPress={() => save({ ...meetup, status: 'Completed' })} icon="check">Mark completed</Button>}
      </View>{!!linkError && <Label>{linkError}</Label>}
    </Panel>}
    {meetup.status === 'Archived' && <Panel>
      <Label size={24} weight="title">Meetup memories</Label>
      {!!meetup.recap && <Label>{meetup.recap}</Label>}
      {ratings && <Label>{ratings.average.toFixed(1)} ★ · {ratings.count} participant {ratings.count === 1 ? 'rating' : 'ratings'}</Label>}
      {!meetup.recap && !ratings && <Label color={palette.muted}>No recap or ratings were saved.</Label>}
    </Panel>}
    {canRate && <Panel>
      <View style={layout.row}><Kits celebrate style={{ width: 85, height: 58, borderRadius: 10 }} /><Label size={24} weight="title">Save the memory</Label></View>
      <Label color={palette.muted}>Recaps and ratings are optional. This demo saves them only on this device.</Label>
      <Field label="Recap caption" value={caption} onChange={setCaption} placeholder="Anong kuwento ng lakad?" />
      <View style={layout.wrap}><Button disabled={!caption.trim()} onPress={() => save({ ...meetup, recap: caption.trim() })}>Save recap</Button>
        {!!meetup.recap && <Button secondary onPress={() => { setCaption(''); save({ ...meetup, recap: undefined }); }}>Remove recap</Button>}</View>
      {currentVoter && <>
        <Label weight="bold">Rate as</Label>
        <View style={layout.wrap}>{meetup.participants.map(friend => <Chip key={friend.id} selected={currentVoter.id === friend.id} onPress={() => setVoter(friend.id)}>{friend.name}</Chip>)}</View>
        <View style={layout.wrap}>{[1, 2, 3, 4, 5].map(value => <Chip key={value} icon="star" selected={meetup.ratings[currentVoter.id] === value} onPress={() => rate(value)}>{value}</Chip>)}
          {meetup.ratings[currentVoter.id] !== undefined && <Chip onPress={() => rate(null)}>Remove rating</Chip>}</View>
      </>}
      {ratings && <Label weight="bold">{ratings.average.toFixed(1)} ★ · {ratings.count} participant {ratings.count === 1 ? 'rating' : 'ratings'}</Label>}
      <Button secondary onPress={() => save({ ...meetup, status: 'Archived' })}>Archive meetup</Button>
    </Panel>}
  </>;
}

function FareField({ label, saved, onSave }: { label: string; saved?: number; onSave: (value?: number) => void }) {
  const [text, setText] = useState(saved?.toString() ?? '');
  const value = text.trim() ? Number(text) : undefined;
  const invalid = value !== undefined && (!Number.isFinite(value) || value < 0);
  return <View style={layout.stack}>
    <Field label={`${label} fare (₱)`} value={text} onChange={setText} />
    {invalid && <Label>Enter a nonnegative fare.</Label>}
    <Button secondary disabled={invalid || value === saved} onPress={() => onSave(value)}>{value === undefined ? 'Clear fare' : 'Save fare'}</Button>
  </View>;
}
