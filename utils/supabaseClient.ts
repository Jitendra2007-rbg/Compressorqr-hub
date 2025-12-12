import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rsgjfcojabqkohonxyky.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZ2pmY29qYWJxa29ob254eWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTYwMzEsImV4cCI6MjA4MTA5MjAzMX0.IzuxoVNOR61laITvOuOBPpsAqWC6ZdnUQX3thSZ5AdE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};