import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Create a single instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false // Don't persist auth state since we're using Stytch
        }
      }
    );
  }
  return supabaseInstance;
}

// Export the singleton instance
export const supabase = getSupabaseClient();
