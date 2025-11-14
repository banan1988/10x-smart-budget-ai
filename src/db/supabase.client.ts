import { createClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types.ts';
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = '3005cb66-fb36-4d74-be85-24c1eaa96e5f'; // Temporary hardcoded user ID for development purposes
