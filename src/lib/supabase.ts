import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").replace(/\s/g, "");

// All application tables live in the `koreabylocal` schema (not `public`).
export const supabase = createClient<Database, "koreabylocal">(
  supabaseUrl,
  supabaseAnonKey,
  { db: { schema: "koreabylocal" } },
);
