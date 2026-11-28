import type { ReactNode } from 'react';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { colors, control, font, radius, spacing } from './theme';
import { surfaces } from './ui-styles';
import { Icon, type IconName, Label, layout } from './ui';

export function IconAction({ name, label, onPress, disabled }: {
  name: IconName; label: string; onPress: () => void; disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const style = { width: control.minimum, height: control.minimum, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: radius.control } as const;
  const foreground = disabled ? colors.onDisabled : colors.onSelected;
  if (Platform.OS === 'web') return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onPress}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setPressed(false); }}
    onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onBlur={() => setPressed(false)}
    onKeyDown={event => { if (event.key === ' ' || event.key === 'Enter') setPressed(true); }}
    onKeyUp={() => setPressed(false)}
    style={{ ...style, display: 'flex', cursor: disabled ? 'default' : 'pointer', border: 0,
      background: disabled ? colors.disabled : pressed ? colors.pressed : hovered ? colors.selected : 'transparent' }}>
    <Icon name={name} color={foreground} />
  </button>;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [style, { backgroundColor: disabled ? colors.disabled : pressed ? colors.pressed : 'transparent' }]}>
    <Icon name={name} color={foreground} />
  </Pressable>;
}

export function ChoiceField<T extends string>({ label, value, options, change, disabled = false }: {
  label: string; value: T; options: readonly { value: T; label: string }[]; change: (value: T) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);
  return <View style={{ minWidth: 0, gap: spacing.sm }}>
    <Label kind="label" color={colors.text}>{label}</Label>
    {Platform.OS === 'web' ? <select aria-label={label} value={value} disabled={disabled} onChange={e => change(e.target.value as T)}
      style={{ width: '100%', minWidth: 0, minHeight: control.minimum, padding: spacing.md, fontFamily: font.regular, fontSize: 16,
        color: disabled ? colors.onDisabled : colors.text, backgroundColor: disabled ? colors.disabled : colors.input,
        border: '1px solid ' + colors.outline, borderRadius: radius.control }}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select> : <>
      <Pressable accessibilityRole="button" accessibilityLabel={label + ', ' + selected?.label} accessibilityState={{ expanded: open && !disabled, disabled }}
        aria-expanded={open && !disabled}
        disabled={disabled} onPress={() => setOpen(!open)} style={({ pressed }) => [surfaces.input, layout.between,
          open && surfaces.focused, pressed && { backgroundColor: colors.pressed }, disabled && surfaces.disabled]}>
        <View style={{ flex: 1 }}><Label color={disabled ? colors.onDisabled : colors.text}>{selected?.label}</Label></View><Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} />
      </Pressable>
      {open && !disabled && <View>{options.map(option => <Pressable key={option.value} accessibilityRole="radio"
        accessibilityState={{ checked: option.value === value }} onPress={() => { change(option.value); setOpen(false); }}
        style={({ pressed }) => [layout.between, { minHeight: control.minimum, borderRadius: radius.control,
          padding: spacing.md, backgroundColor: pressed ? colors.pressed : option.value === value ? colors.selected : colors.surface }]}>
        <View style={{ flex: 1 }}><Label>{option.label}</Label></View>{option.value === value && <Icon name="check" size={16} />}
      </Pressable>)}</View>}
    </>}
  </View>;
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return <View style={{ gap: spacing.md, marginTop: spacing.sm, borderTopWidth: 1, borderColor: colors.divider, paddingTop: spacing.xl }}>
    <Label kind="item" heading>{title}</Label>{children}
  </View>;
}
