import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Feedback, Label, Panel } from './ui';

export function DestinationReview({ name, children, blocked }: {
  name: string; children: ReactNode; blocked?: string;
}) {
  return <Panel>
    <Label kind="item" heading>{name}</Label>
    <Label kind="detail">Confirming closes voting.</Label>
    {!!blocked && <Feedback tone="warning">{blocked}</Feedback>}
    {children}
  </Panel>;
}

export function PlanningVotes({ people, choices }: {
  people: { id: string; name: string }[]; choices: { id: string; name: string; voters: string[] }[];
}) {
  const voted = new Set(choices.flatMap(choice => choice.voters));
  if (!people.length) return null;
  return <Panel>
    <Label kind="item" heading>Votes · {voted.size}/{people.length}</Label>
    {choices.filter(choice => choice.voters.length).map(choice => <View key={choice.id} style={{ gap: 4 }}>
      <Label kind="value">{choice.name} · {choice.voters.length} {choice.voters.length === 1 ? 'vote' : 'votes'}</Label>
      <Label kind="detail">{people.filter(person => choice.voters.includes(person.id)).map(person => person.name).join(', ')}</Label>
    </View>)}
  </Panel>;
}
