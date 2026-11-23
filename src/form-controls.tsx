import type { ReactNode } from 'react';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { font, palette, radius, spacing } from './theme';
import { Icon, type IconName, Label, layout } from './ui';

export function IconAction({ name, label, onPress, disabled }: {
  name: IconName; label: string; onPress: () => void; disabled?: boolean;
}) {
  const style = { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control } as const;
  if (Platform.OS === 'web') return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onPress}
    style={{ ...style, display: 'flex', flexShrink: 0, cursor: disabled ? 'default' : 'pointer', background: 'transparent', border: 0, opacity: disabled ? 0.45 : 1 }}>
    <Icon name={name} color={palette.plum} />
  </button>;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [style, { opacity: disabled ? 0.45 : 1, backgroundColor: pressed ? palette.lavender : 'transparent' }]}>
    <Icon name={name} color={palette.plum} />
  </Pressable>;
}

export function ChoiceField<T extends string>({ label, value, options, change }: {
  label: string; value: T; options: readonly { value: T; label: string }[]; change: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const control = { minHeight: 44, borderRadius: radius.control, borderWidth: 1, borderColor: palette.line,
    backgroundColor: palette.white, paddingHorizontal: spacing.md };
  const selected = options.find(option => option.value === value);
  return <View style={{ minWidth: 0, gap: spacing.xs }}>
    <Label kind="label">{label}</Label>
    {Platform.OS === 'web' ? <select aria-label={label} value={value} onChange={e => change(e.target.value as T)}
      style={{ width: '100%', minWidth: 0, minHeight: 44, padding: '0 10px', fontFamily: font.regular, fontSize: 16,
        color: palette.ink, backgroundColor: palette.white, border: '1px solid ' + palette.line, borderRadius: radius.control }}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select> : <>
      <Pressable accessibilityRole="button" accessibilityLabel={label + ', ' + selected?.label} accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)} style={[control, layout.between]}>
        <View style={{ flex: 1 }}><Label>{selected?.label}</Label></View><Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
      </Pressable>
      {open && <View>{options.map(option => <Pressable key={option.value} accessibilityRole="radio"
        accessibilityState={{ checked: option.value === value }} onPress={() => { change(option.value); setOpen(false); }}
        style={[layout.between, { minHeight: 44, paddingHorizontal: spacing.md }]}>
        <View style={{ flex: 1 }}><Label>{option.label}</Label></View>{option.value === value && <Icon name="check" size={16} />}
      </Pressable>)}</View>}
    </>}
  </View>;
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return <View style={{ gap: spacing.md, marginTop: spacing.xs, borderTopWidth: 1, borderColor: palette.line, paddingTop: spacing.lg }}>
    <Label weight="title" size={19} heading>{title}</Label>{children}
  </View>;
}
