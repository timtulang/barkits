import Feather from '@expo/vector-icons/Feather';
import type { ComponentProps, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { font, palette, typography } from './theme';

export type IconName = ComponentProps<typeof Feather>['name'];

export function Icon({ name, size = 19, color = palette.ink }: { name: IconName; size?: number; color?: string }) {
  return <View aria-hidden importantForAccessibility="no-hide-descendants" style={{ flexShrink: 0 }}>
    <Feather name={name} size={size} color={color} />
  </View>;
}

export function Label({ children, kind = 'body', size = typography[kind].size, weight = typography[kind].weight,
  color = typography[kind].color, heading = false, numberOfLines }: {
  children: ReactNode; kind?: keyof typeof typography; size?: number; weight?: keyof typeof font;
  color?: string; heading?: boolean; numberOfLines?: number;
}) {
  return <Text numberOfLines={numberOfLines} accessibilityRole={heading ? 'header' : undefined}
    style={{ fontFamily: font[weight], color, fontSize: size, flexShrink: 1,
      letterSpacing: weight === 'title' ? -size * 0.028 : 0,
      lineHeight: Math.ceil(size * (weight === 'title' ? 1.2 : 1.45)),
      fontVariant: kind === 'value' ? ['tabular-nums'] : undefined }}>{children}</Text>;
}
