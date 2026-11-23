import type { ReactNode } from 'react';
import { Modal, ScrollView, useWindowDimensions, View } from 'react-native';
import { Label, Panel } from './ui';

export function EditorDialog({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const compact = useWindowDimensions().width < 600;
  return <Modal transparent animationType="none" visible onRequestClose={close}>
    <View style={{ flex: 1, backgroundColor: '#291D3277', justifyContent: compact ? 'flex-end' : 'center', padding: compact ? 0 : 18 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: compact ? 'flex-end' : 'center' }}>
        <Panel style={{ width: '100%', maxWidth: 490, alignSelf: 'center', ...(compact ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: 32 } : {}) }}>
          <Label size={27} weight="title">{title}</Label>
          {children}
        </Panel>
      </ScrollView>
    </View>
  </Modal>;
}
