import { View } from 'react-native';
import { avatars, type AccountSettings } from './account-settings';
import { ChoiceField, FormSection } from './form-controls';
import { categories } from './discovery';
import { modes } from './planner';
import { spacing } from './theme';
import { Chip, Field, Icon, Label, layout } from './ui';

export function AccountSettingsFields({ value, change, disabled, budget, duration, setBudget, setDuration }: {
  value: AccountSettings; change: (value: AccountSettings) => void; disabled: boolean;
  budget: string; duration: string; setBudget: (value: string) => void; setDuration: (value: string) => void;
}) {
  const patch = (next: Partial<AccountSettings>) => change({ ...value, ...next });
  return <View style={{ gap: spacing.md }}>
    <Field label="Username (optional)" autoCapitalize="none" autoCorrect={false} value={value.username ?? ''} disabled={disabled}
      hint="3–24 lowercase letters, numbers or underscores; start with a letter. Usernames are unique."
      onChange={username => patch({ username: username || null })} />
    <Field label="Biography (optional)" value={value.biography} disabled={disabled}
      hint="Up to 500 characters. Your biography and settings are private to your account."
      onChange={biography => patch({ biography })} />
    <Label kind="label">Avatar</Label>
    <View style={layout.wrap}>{avatars.map(avatar => <Chip key={avatar} selected={value.avatar === avatar} disabled={disabled}
      onPress={() => patch({ avatar })}><Icon name={avatar} size={16} /> {avatar === 'map-pin' ? 'Pin' : avatar[0].toUpperCase() + avatar.slice(1)}</Chip>)}</View>
    <FormSection title="Planning defaults">
      <Label kind="detail">Prefill your new starting point. You can change each meetup’s inputs before saving.</Label>
      <ChoiceField label="Preferred transport" value={value.mode ?? ''} disabled={disabled}
        options={[{ value: '', label: 'No preference' }, ...modes.map(mode => ({ value: mode, label: mode }))]}
        change={mode => patch({ mode: mode || null })} />
      <Field label="Maximum one-way fare (₱, optional)" value={budget} onChange={setBudget} disabled={disabled} inputMode="decimal" />
      <Field label="Maximum travel time (minutes, optional)" value={duration} onChange={setDuration} disabled={disabled} inputMode="numeric" />
      <ChoiceField label="Preferred type of place" value={value.category} disabled={disabled}
        options={categories.map(category => ({ value: category, label: category }))} change={category => patch({ category })} />
    </FormSection>
    <FormSection title="Privacy and reminders">
      <ChoiceField label="New recap audience" value={value.recap_audience} disabled={disabled}
        options={[{ value: 'private', label: 'Only me' }, { value: 'group', label: 'Meetup members' }]}
        change={recap_audience => patch({ recap_audience })} />
      <Label kind="detail">This selects the audience in new recap drafts. You still choose Save privately or Publish to group.</Label>
      <ChoiceField label="Dashboard action reminders" value={value.reminders ? 'on' : 'off'} disabled={disabled}
        options={[{ value: 'on', label: 'Show my outstanding actions' }, { value: 'off', label: 'Hide action reminders' }]}
        change={reminders => patch({ reminders: reminders === 'on' })} />
      <Label kind="detail">These are in-app dashboard reminders. Barkits does not send push notifications or emails.</Label>
    </FormSection>
  </View>;
}
