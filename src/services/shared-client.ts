import { authSetup } from './auth';

export function client() {
  if (!authSetup.client) throw new Error('Connect Supabase to use shared meetups.');
  return authSetup.client;
}
export class SharedRequestError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

export async function result<T>(query: PromiseLike<{ data: T | null; status?: number; error: { message: string; code?: string } | null }>) {
  const { data, error, status } = await query;
  if (error) throw new SharedRequestError(['PGRST202', 'PGRST205', '42P01', '42703', 'PGRST200'].includes(error.code ?? '') ?
    'Shared meetups need the Barkits database migrations in this Supabase project.' : error.message, status);
  return data;
}
