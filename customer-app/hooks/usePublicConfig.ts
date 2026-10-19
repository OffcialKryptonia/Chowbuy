import { useQuery } from '@tanstack/react-query';
import { ok, supabase } from '@/lib/supabase';
import { DEMO, FALLBACK_CONFIG } from '@/lib/config';
import type { PublicConfig } from '@/lib/types';

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
/** Fills any section the admin has not published yet with safe defaults, so a partly configured backend never crashes the app. */
const merge = (base: unknown, over: unknown): PublicConfig => {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  if (isObj(over)) for (const [k, v] of Object.entries(over)) out[k] = isObj(v) && isObj(out[k]) ? merge(out[k], v) : v;
  return out as unknown as PublicConfig;
};

/** Gateway, call and push settings published from Admin. Secrets are never part of this payload. */
export function usePublicConfig() {
  return useQuery<PublicConfig>({
    queryKey: ['public-config'],
    queryFn: async () => (DEMO ? (FALLBACK_CONFIG as PublicConfig) : merge(FALLBACK_CONFIG, ok(await supabase.rpc('get_public_config')))),
    staleTime: 5 * 60000,
    initialData: FALLBACK_CONFIG as PublicConfig,
  });
}
