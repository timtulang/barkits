import 'react-native-url-polyfill/auto';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { sessionStorage } from './session-storage';

const projectUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

function configureAuth(): { client?: SupabaseClient; message?: string } {
  if (!projectUrl && !publishableKey) return { message: 'This deployment supports on-device planning. Email sign-in needs a connected Supabase project.' };
  if (!projectUrl || !publishableKey?.startsWith('sb_publishable_')) {
    return { message: 'Account setup is incomplete. Check the project URL and publishable key.' };
  }
  try {
    const url = new URL(projectUrl);
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
      return { message: 'Account setup requires an HTTPS project URL or a local development server.' };
    }
    const client = createClient(projectUrl, publishableKey, { auth: {
      storage: sessionStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false,
      ...(Platform.OS === 'web' ? {} : { lock: processLock }),
    } });
    return { client };
  } catch {
    return { message: 'Account setup failed. Check the project URL and publishable key.' };
  }
}
export const authSetup = configureAuth();
