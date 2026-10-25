import { useQuery } from '@tanstack/react-query';
import { DEMO } from '@/lib/config';
import { myGroups, type Group } from '@/lib/groups';

/** The signed-in user's group orders. Group orders need the live backend, so demo mode shows none. */
export function useGroups() {
  return useQuery<Group[]>({ queryKey: ['groups'], queryFn: myGroups, enabled: !DEMO, initialData: [], refetchInterval: 15000 });
}
