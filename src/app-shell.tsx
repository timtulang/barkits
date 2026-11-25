import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, control, palette, radius, spacing } from './theme';
import { Button, Icon, Label, layout } from './ui';

export function AppHeader({ signedIn, inMeetup, compact, home, account, create }: {
  signedIn: boolean; inMeetup: boolean; compact: boolean; home: () => void; account: () => void; create: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return <View style={styles.header}><View style={[shellStyles.container, styles.headerInner]}>
    <View style={styles.identity}>
      <Pressable accessibilityRole="button" accessibilityLabel="Barkits home" onPress={home}
        onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [styles.brand, hovered && { backgroundColor: colors.hover }, pressed && { backgroundColor: colors.pressed }]}>
        <View style={styles.logo}><Icon name="map-pin" size={21} /></View>
        <Label kind="section">barkits.</Label>
      </Pressable>
      {!compact && <Label kind="detail">Made for the barkada.</Label>}
    </View>
    <View style={layout.wrap}>
      {inMeetup && <Button secondary icon="plus" onPress={create} accessibilityLabel="New meetup">{compact ? 'New' : 'New meetup'}</Button>}
      <Button quiet icon="user" onPress={account} accessibilityLabel={signedIn ? 'Your account' : 'Sign in'}>
        {signedIn ? 'Account' : 'Sign in'}
      </Button>
    </View>
  </View></View>;
}

export function AppFooter() {
  return <View style={styles.footer}><Icon name="map-pin" size={16} color={colors.info} />
    <Label kind="caption">Good plans start with the barkada.</Label>
  </View>;
}

export const shellStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  container: { width: '100%', maxWidth: 1112, alignSelf: 'center', paddingHorizontal: spacing.lg },
  content: { paddingTop: spacing.xl, paddingBottom: spacing.section, gap: spacing.xl, flexGrow: 1 },
});

const styles = StyleSheet.create({
  header: { backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.divider },
  headerInner: { minHeight: 80, paddingVertical: spacing.sm, flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  identity: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.lg },
  brand: { minHeight: control.minimum, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.control },
  logo: { backgroundColor: palette.coral, width: 36, height: 36, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 'auto', paddingTop: spacing.xl },
});
