import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log environment variables (remove in production)
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:');
  console.error('URL defined:', !!supabaseUrl);
  console.error('Key defined:', !!supabaseAnonKey);
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Initialize Supabase client
console.log('Initializing Supabase client with URL:', supabaseUrl.substring(0, 20) + '...');
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Log successful initialization
try {
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Error with Supabase client:', error);
}
