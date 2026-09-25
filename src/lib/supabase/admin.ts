import "server-only";
import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "./config";

/**
 * Client `service_role` — contourne le RLS.
 * À n'utiliser QUE dans les routes serveur de confiance (webhooks Make.com / N8N).
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL manquant.");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
