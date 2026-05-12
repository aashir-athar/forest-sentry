// Connects NetInfo → sync engine → app store. Runs once on mount, then on connectivity change.
import { errorReporter } from '@/src/lib/errorReporter';
import { useSyncStore } from '@/src/stores/useSyncStore';
import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { countsForSync, drainSyncQueue } from './syncEngine';

let inFlight = false;

export function useSyncQueue() {
  const setPending = useSyncStore((s) => s.setPending);
  const setOnline = useSyncStore((s) => s.setOnline);
  const setDraining = useSyncStore((s) => s.setDraining);
  const setLastSync = useSyncStore((s) => s.setLastSync);
  const setLastError = useSyncStore((s) => s.setLastError);

  useEffect(() => {
    let active = true;

    async function refreshCounts() {
      try {
        const pending = await countsForSync();
        if (!active) return;
        setPending(pending);
      } catch (error) {
        errorReporter.capture(error);
      }
    }

    async function attemptDrain(reachable: boolean) {
      if (!reachable || inFlight) return;
      inFlight = true;
      setDraining(true);
      try {
        const res = await drainSyncQueue();
        setLastSync(new Date().toISOString());
        if (res.failed > 0) setLastError(res.errors[0]);
        else setLastError(undefined);
        await refreshCounts();
      } catch (error) {
        errorReporter.capture(error);
        setLastError(error instanceof Error ? error.message : 'Sync failed.');
      } finally {
        inFlight = false;
        setDraining(false);
      }
    }

    void refreshCounts();

    const sub = NetInfo.addEventListener((state) => {
      const reachable = state.isConnected === true && state.isInternetReachable !== false;
      setOnline(reachable);
      void attemptDrain(reachable);
    });

    return () => {
      active = false;
      sub();
    };
  }, [setPending, setOnline, setDraining, setLastSync, setLastError]);
}
