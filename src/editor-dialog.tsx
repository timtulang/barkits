import type { ReactNode } from 'react';
import { Modal, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconAction } from './form-controls';
import { palette, radius, spacing } from './theme';
import { Label, layout } from './ui';

export function EditorDialog({ title, close, busy, actions, children }: {
  title: string; close: () => void; busy?: boolean; actions?: ReactNode; children: ReactNode;
}) {
  const compact = useWindowDimensions().width < 600;
  const insets = useSafeAreaInsets();
  return <Modal transparent animationType="none" visible onRequestClose={() => { if (!busy) close(); }}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#291D3277',
      justifyContent: compact ? 'flex-end' : 'center', paddingHorizontal: compact ? 0 : spacing.lg,
      paddingTop: Math.max(insets.top, spacing.md), paddingBottom: compact ? 0 : spacing.lg }}>
      <View style={{ width: '100%', maxWidth: 500, maxHeight: '100%', alignSelf: 'center', backgroundColor: palette.paper,
        borderRadius: radius.card, borderBottomLeftRadius: compact ? 0 : radius.card, borderBottomRightRadius: compact ? 0 : radius.card,
        paddingBottom: compact ? insets.bottom : 0, overflow: 'hidden' }}>
        <View style={[layout.between, { paddingLeft: spacing.xl, paddingRight: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs }]}>
          <View style={{ flex: 1 }}><Label size={26} weight="title" heading>{title}</Label></View>
          <IconAction name="x" label={'Close ' + title.toLowerCase()} onPress={close} disabled={busy} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
          {children}
        </ScrollView>
        {actions && <View style={[layout.wrap, { borderTopWidth: 1, borderColor: palette.line, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }]}>{actions}</View>}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
