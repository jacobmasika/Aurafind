import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hxtmqgkirxrqtoewvyor.supabase.co';
const supabaseAnonKey =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
	'sb_publishable_K7AeTa5FqlPlx8ogz9qH0g_vy1OS55Z';

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		'Missing Supabase client environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
