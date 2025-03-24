import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam as credenciais do Supabase. Por favor, configure as variáveis de ambiente.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);