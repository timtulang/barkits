import type { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { colors, radius, spacing } from './theme';
import { Icon, Label, layout, type IconName } from './ui';

export function WorkspaceColumns({ main, side, sideFirst = false }: { main: ReactNode; side: ReactNode; sideFirst?: boolean }) {
  const wide = useWindowDimensions().width >= 940;
  if (!main) return <View style={layout.stack}>{side}</View>;
  const primary = <View key="main" style={[layout.stack, { minWidth: 0 }, wide && { flex: 1.85 }]}>{main}</View>;
  const aside = <View key="side" style={[layout.stack, { minWidth: 0 }, wide && { flex: 1 }]}>{side}</View>;
  return <View style={{ flexDirection: wide ? 'row' : 'column', gap: wide ? spacing.section : spacing.lg }}>
    {!wide && sideFirst ? [aside,primary] : [primary,aside]}
  </View>;
}

export function StatusMark({ status }: { status: string }) {
  const marks: Record<string, [IconName, string, string]> = {
    draft: ['edit-3', colors.warningSurface, colors.warning], planning: ['users', colors.warningSurface, colors.warning],
    decided: ['map-pin', colors.infoSurface, colors.info], completed: ['check-circle', colors.successSurface, colors.success],
    archived: ['archive', colors.disabled, colors.textMuted],
  };
  const mark = marks[status.toLowerCase()];
  if (!mark) throw new Error('Unknown meetup status: ' + status);
  const [icon, background, foreground] = mark;
  return <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: spacing.sm,
    maxWidth: '100%', backgroundColor: background, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.control }}>
    <Icon name={icon} size={14} color={foreground}/><Label kind="label" color={foreground}>{status[0].toUpperCase() + status.slice(1).toLowerCase()}</Label>
  </View>;
}
