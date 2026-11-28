import type { SharedSummary } from './shared-meetups';
import type { AccountSettings } from '../account-settings';
import { apiRequest } from './shared-client';
export const readSettings = () => apiRequest<AccountSettings>('/account/settings');
export const saveSettings = (settings: AccountSettings) => apiRequest<AccountSettings>('/account/settings', settings);
export type SecurityReview = {
  recent_login: boolean; expires_at: string; session_count: number; meetup_count: number; revision: string;
  owned: { id: string; name: string; members: { id: string; name: string }[] }[];
};
export const readSecurity = () => apiRequest<SecurityReview>('/account/security');
export const revokeOtherSessions = () => apiRequest<{ revoked: boolean }>('/account/revoke-others', {});
export const deleteAccount = (revision: string, successors: Record<string,string>) =>
  apiRequest<{ deleted: boolean }>('/account/delete', { revision, successors, confirmation: 'DELETE' });

export type Dashboard = { plans: (SharedSummary & { next_action: string | null })[]; total: number; offset: number; next_offset: number | null };
export const readDashboard = (past: boolean, offset: number) => apiRequest<Dashboard>(`/account/dashboard?past=${past}&offset=${offset}`);
