/// <reference types="astro/client" />

/**
 * User object stored in Astro.locals during authenticated requests
 */
interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  nickname?: string;
  createdAt?: string; // User registration date (ISO 8601 format)
}

declare global {
  namespace App {
    interface Locals {
      user?: User;
      supabase?: any; // SupabaseClient type
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_MODEL: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
