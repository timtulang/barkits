import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors, spacing } from '../src/theme';
import { StatusBar } from 'expo-status-bar';
import { MeetupsProvider } from '../src/meetups';

export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  const [ready, error] = useFonts({ Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black });
  if (error) throw error;
  if (!ready) return <View accessibilityLiveRegion="polite" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, backgroundColor: colors.canvas }}>
    <ActivityIndicator color={colors.info} /><Text style={{ color: colors.text, fontSize: 16 }}>Loading Barkits…</Text>
  </View>;
  return <MeetupsProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }} /></MeetupsProvider>;
}
