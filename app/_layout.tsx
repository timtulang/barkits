import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { StatusBar } from 'expo-status-bar';
import { MeetupsProvider } from '../src/meetups';

export const unstable_settings = { initialRouteName: 'index' };

export default function Layout() {
  const [ready, error] = useFonts({ Nunito_600SemiBold, Nunito_800ExtraBold, Nunito_900Black });
  if (error) throw error;
  if (!ready) return null;
  return <MeetupsProvider>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false }} />
  </MeetupsProvider>;
}
