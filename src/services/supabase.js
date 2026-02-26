import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO SUPABASE ---
// Você pegará esses dados no painel do Supabase (Project Settings > API)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
