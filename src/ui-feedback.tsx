import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors, radius, spacing } from './theme';
import { Icon, Label, type IconName } from './ui-text';

const tones = {
  info: { foreground: colors.info, background: colors.infoSurface, icon: 'info' },
  success: { foreground: colors.success, background: colors.successSurface, icon: 'check-circle' },
  warning: { foreground: colors.warning, background: colors.warningSurface, icon: 'alert-triangle' },
  error: { foreground: colors.error, background: colors.errorSurface, icon: 'alert-circle' },
} satisfies Record<string, { foreground: string; background: string; icon: IconName }>;

export function StatusLine({ children, tone = 'info', icon }: {
  children: ReactNode; tone?: keyof typeof tones; icon?: IconName;
}) {
  const state = tones[tone];
  return <View role="status" accessibilityLiveRegion="polite" aria-live="polite"
    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minWidth: 0 }}>
    <Icon name={icon ?? state.icon} size={16} color={state.foreground} />
    <Label kind="detail" color={state.foreground}>{children}</Label>
  </View>;
}

export function Feedback({ children, tone = 'info', title, action }: {
  children: ReactNode; tone?: keyof typeof tones; title?: string; action?: ReactNode;
}) {
  const state = tones[tone];
  return <View style={{ backgroundColor: state.background, borderRadius: radius.control, padding: spacing.lg, gap: spacing.md }}>
    <View accessibilityRole={tone === 'error' ? 'alert' : undefined} accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
      <Icon name={state.icon} color={state.foreground} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        {!!title && <Label weight="bold" color={state.foreground}>{title}</Label>}
        <Label color={state.foreground}>{children}</Label>
      </View>
    </View>
    {action}
  </View>;
}

export function LoadingState({ label }: { label: string }) {
  return <View accessibilityLiveRegion="polite" accessibilityState={{ busy: true }} aria-busy
    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg }}>
    <ActivityIndicator color={colors.info} aria-hidden importantForAccessibility="no-hide-descendants" />
    <Label color={colors.textMuted}>{label}</Label>
  </View>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <View style={{ gap: spacing.md, paddingVertical: spacing.lg }}>
    <Label kind="item" heading>{title}</Label>
    <Label color={colors.textMuted}>{children}</Label>
    {action}
  </View>;
}
