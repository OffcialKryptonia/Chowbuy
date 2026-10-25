import { useQuery } from '@tanstack/react-query';
import { ok, supabase } from '@/lib/supabase';
import { DEMO } from '@/lib/config';
import { EMPTY_CATALOG, parseCatalog, type CatalogConfig } from '@/lib/catalog-config';

/** Categories, featured brands, delivery areas and Smart Cart settings published from the Admin Console. Offline or unconfigured means no changes. */
export function useCatalogConfig() {
  return useQuery<CatalogConfig>({
    queryKey: ['public-catalog'],
    queryFn: async () => (DEMO ? EMPTY_CATALOG : parseCatalog(ok(await supabase.rpc('get_public_catalog')))),
    staleTime: 5 * 60000,
    initialData: EMPTY_CATALOG,
  });
}
