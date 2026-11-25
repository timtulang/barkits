import type { ReactNode } from 'react';
import { View, type ViewStyle } from 'react-native';
import { surfaces } from './ui-styles';

export { Icon, Label, type IconName } from './ui-text';
export { Button, Chip } from './ui-actions';
export { Field } from './ui-field';
export { Feedback, LoadingState, EmptyState } from './ui-feedback';
export { layout } from './ui-styles';

export function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[surfaces.panel, style]}>{children}</View>;
}
