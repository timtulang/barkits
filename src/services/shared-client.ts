import { authSetup } from './auth';

export function client() {
  if (!authSetup.client) throw new Error('Connect Supabase to use shared meetups.');
  return authSetup.client;
}
export async function result<T>(query: PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>) {
  const { data, error } = await query;
  if (error) throw new Error(['PGRST202', 'PGRST205', '42P01', '42703', 'PGRST200'].includes(error.code ?? '') ?
    'Shared meetups need the Barkits database migrations in this Supabase project.' : error.message);
  return data;
}
