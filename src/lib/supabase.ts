import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").replace(/\s/g, "");

// All application tables live in the `koreabylocal` schema (not `public`).
export const supabase = createClient<Database, "koreabylocal">(
  supabaseUrl,
  supabaseAnonKey,
  {
    db: { schema: "koreabylocal" },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Bypass the Web Locks API. Its contention ("lock not released within
      // 5000ms" / "lock broken by 'steal'") was aborting in-flight queries in
      // the browser, leaving pages empty. Run the callback without locking.
      lock: async <R,>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn(),
    },
  },
);
