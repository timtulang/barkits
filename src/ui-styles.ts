import { StyleSheet } from 'react-native';
import { colors, control, font, radius, spacing } from './theme';

export const layout = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  stack: { gap: spacing.md },
});

export const surfaces = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider,
    borderRadius: radius.card, padding: spacing.xl, gap: spacing.md, minWidth: 0 },
  input: { minHeight: control.minimum, minWidth: 0, borderRadius: radius.control,
    borderWidth: control.border, borderColor: colors.outline, backgroundColor: colors.input,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.text, fontFamily: font.regular, fontSize: 16 },
  focused: { borderColor: colors.focus },
  disabled: { backgroundColor: colors.disabled, color: colors.onDisabled },
});
