import { createContext, useContext, type ReactNode } from 'react';
import { readSettings } from './services/account';
import { useSharedData } from './use-shared-data';
import type { AccountSettings } from './account-settings';

type SettingsState = { data?: AccountSettings; error: string; loading: boolean; refresh: () => void };
const Context = createContext<SettingsState>({ error: '', loading: false, refresh: () => { throw new Error('Account settings require a signed-in provider.'); } });
export function AccountSettingsProvider({ children }: { children: ReactNode }) {
  const state = useSharedData(readSettings);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export const useAccountSettings = () => useContext(Context);
