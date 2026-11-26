import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Button, Feedback, Label, Panel, layout } from './ui';

export function DestinationReview({ name, children, blocked, busy = false, confirm, cancel }: {
  name: string; children: ReactNode; blocked?: string; busy?: boolean; confirm: () => void; cancel: () => void;
}) {
  return <Panel>
    <Label kind="item" heading>Review destination: {name}</Label>
    <Label>This place is not confirmed yet. Confirming sets the destination and closes voting.</Label>
    <Label kind="detail">Date and time may stay undecided. No routes, fares or bookings are guaranteed. The place remains available in Where if you leave this review.</Label>
    {children}
    {!!blocked && <Feedback tone="warning">{blocked}</Feedback>}
    <View style={layout.wrap}>
      <Button disabled={busy || !!blocked} busy={busy} busyLabel="Confirming destination…" onPress={confirm}>Confirm destination</Button>
      <Button secondary disabled={busy} onPress={cancel}>Return to places without confirming</Button>
    </View>
  </Panel>;
}

export function PlanningVotes({ people, choices }: {
  people: { id: string; name: string }[]; choices: { id: string; name: string; voters: string[] }[];
}) {
  const voted = new Set(choices.flatMap(choice => choice.voters));
  return <Panel>
    <Label kind="item" heading>Group decisions</Label>
    <Label kind="detail">{voted.size} of {people.length} people have a recorded vote. Votes do not automatically confirm a destination.</Label>
    {choices.filter(choice => choice.voters.length).map(choice => <View key={choice.id} style={{ gap: 4 }}>
      <Label kind="value">{choice.name} · {choice.voters.length} {choice.voters.length === 1 ? 'vote' : 'votes'}</Label>
      <Label kind="detail">{people.filter(person => choice.voters.includes(person.id)).map(person => person.name).join(', ')}</Label>
    </View>)}
    {people.some(person => !voted.has(person.id)) && <Label kind="detail">Not voted: {people.filter(person => !voted.has(person.id)).map(person => person.name).join(', ')}</Label>}
  </Panel>;
}
