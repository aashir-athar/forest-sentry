// React Query — generous offline cache with AsyncStorage persister.
// Field rangers work for hours without bars; we keep the cache warm.
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24 * 14,
      retry: (failureCount) => failureCount < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'forest-sentry:rq-cache',
  throttleTime: 1000,
});
