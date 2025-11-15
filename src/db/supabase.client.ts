import { createClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types.ts';
import { DEFAULT_USER_ID } from './constants.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export type SupabaseClient = typeof supabaseClient;

export { DEFAULT_USER_ID };
