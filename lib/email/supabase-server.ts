// lib/email/supabase-server.ts
// Server-side Supabase client for the email module API routes.
// Adjust the import path if your project structure differs.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function getEmailSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set() { /* read-only in route handlers */ },
        remove() { /* read-only in route handlers */ },
      },
    }
  );
}

// Service-role client for trusted server tasks (tracking endpoints, send pipeline).
// NEVER expose service role to the browser.
import { createClient } from '@supabase/supabase-js';

export function getEmailServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
