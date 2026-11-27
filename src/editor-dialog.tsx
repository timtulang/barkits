import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Modal, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconAction } from './form-controls';
import { colors, elevation, radius, spacing } from './theme';
import { Label, layout } from './ui';

export function EditorDialog({ title, close, busy, actions, children }: {
  title: string; close: () => void; busy?: boolean; actions?: ReactNode; children: ReactNode;
}) {
  const compact = useWindowDimensions().width < 600;
  const insets = useSafeAreaInsets();
  const gutter = compact ? spacing.lg : spacing.xl;
  const scroll = useRef<ScrollView>(null);
  const [visibleArea, setVisibleArea] = useState<{ height: number; top: number }>();
  useEffect(() => {
    if (Platform.OS !== 'web' || !compact || !window.visualViewport) return;
    const viewport = window.visualViewport;
    function update() {
      setVisibleArea(viewport.scale === 1 && viewport.height < window.innerHeight
        ? { height: viewport.height, top: viewport.offsetTop } : undefined);
    }
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [compact]);
  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || !compact || !visibleArea?.height) return;
    const scroller: unknown = scroll.current?.getScrollableNode();
    const focused = document.activeElement;
    if (scroller instanceof HTMLElement && focused?.matches('input, textarea') && scroller.contains(focused)) {
      focused.scrollIntoView({ block: 'nearest' });
    }
  }, [compact, visibleArea?.height]);

  return <Modal transparent animationType="none" visible onRequestClose={() => { if (!busy) close(); }}>
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[{ flex: 1,
      justifyContent: compact ? 'flex-end' : 'center', paddingHorizontal: compact ? 0 : spacing.lg,
      paddingTop: Math.max(insets.top, spacing.md), paddingBottom: compact ? 0 : spacing.lg },
      compact && visibleArea && { position: 'absolute', left: 0, right: 0, top: visibleArea.top, height: visibleArea.height }]}>
      <View style={{ ...elevation.sheet, width: '100%', maxWidth: 500, maxHeight: '100%', alignSelf: 'center', backgroundColor: colors.surface,
        borderRadius: radius.card, borderBottomLeftRadius: compact ? 0 : radius.card, borderBottomRightRadius: compact ? 0 : radius.card,
        paddingBottom: compact ? insets.bottom : 0, overflow: 'hidden' }}>
        <View style={[layout.between, { paddingLeft: gutter, paddingRight: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs }]}>
          <View style={{ flex: 1 }}><Label kind="section" heading>{title}</Label></View>
          <IconAction name="x" label={'Close ' + title.toLowerCase()} onPress={close} disabled={busy} />
        </View>
        <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0, flexShrink: 1, minHeight: 0 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: spacing.lg, gap: spacing.md }}>
          {children}
        </ScrollView>
        {actions && <View style={[layout.wrap, { borderTopWidth: 1, borderColor: colors.divider, paddingHorizontal: gutter, paddingVertical: spacing.md }]}>{actions}</View>}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
