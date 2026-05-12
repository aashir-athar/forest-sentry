import { listInspectionsForTree } from '@/src/db/repos';
import { useQuery } from '@tanstack/react-query';

export function useInspectionsFor(treeId: string | null | undefined) {
  return useQuery({
    queryKey: treeId ? ['inspections', treeId] : ['inspections', 'none'],
    queryFn: () => (treeId ? listInspectionsForTree(treeId) : Promise.resolve([])),
    enabled: !!treeId,
  });
}
