import type { ReactNode } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { Label, Panel } from './ui';

export function EditorDialog({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return <Modal transparent animationType="none" visible onRequestClose={close}>
    <View style={{ flex: 1, backgroundColor: '#291D3277', justifyContent: 'center', padding: 18 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <Panel style={{ width: '100%', maxWidth: 490, alignSelf: 'center' }}>
          <Label size={27} weight="title">{title}</Label>
          {children}
        </Panel>
      </ScrollView>
    </View>
  </Modal>;
}
