export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Sans variables Supabase, l'application tourne en "mode démo" :
 * pas d'authentification, données issues de `lib/data/mock.ts`.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
