import type { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { palette, spacing } from './theme';
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
  const marks: Record<string, [IconName,string]> = { draft: ['edit-3',palette.softMango], planning: ['users',palette.softMango],
    decided: ['map-pin',palette.lavender], completed: ['check-circle',palette.mint], archived: ['archive',palette.line] };
  const [icon, bg] = marks[status.toLowerCase()] ?? marks.planning;
  return <View style={{ flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
    <Icon name={icon} size={14}/><Label size={13} weight="bold">{status[0].toUpperCase() + status.slice(1).toLowerCase()}</Label>
  </View>;
}
