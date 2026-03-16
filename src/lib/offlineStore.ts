import { OfflineReport, Ticket } from '../types';

const OFFLINE_REPORTS_KEY = 'cheboko_offline_reports';
const OFFLINE_TICKETS_KEY = 'cheboko_offline_tickets';

/** Save tickets to local storage for offline access */
export function cacheTickets(tickets: Ticket[]): void {
  try {
    localStorage.setItem(OFFLINE_TICKETS_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.warn('[Offline] Failed to cache tickets:', e);
  }
}

/** Get cached tickets */
export function getCachedTickets(): Ticket[] {
  try {
    const data = localStorage.getItem(OFFLINE_TICKETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/** Save offline report */
export function saveOfflineReport(report: OfflineReport): void {
  const reports = getOfflineReports();
  reports.push(report);
  localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(reports));
}

/** Get all offline reports */
export function getOfflineReports(): OfflineReport[] {
  try {
    const data = localStorage.getItem(OFFLINE_REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/** Get unsynced offline reports */
export function getUnsyncedReports(): OfflineReport[] {
  return getOfflineReports().filter((r) => !r.synced);
}

/** Mark report as synced */
export function markReportSynced(reportId: string): void {
  const reports = getOfflineReports();
  const updated = reports.map((r) => (r.id === reportId ? { ...r, synced: true } : r));
  localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(updated));
}

/** Remove synced reports */
export function clearSyncedReports(): void {
  const reports = getOfflineReports().filter((r) => !r.synced);
  localStorage.setItem(OFFLINE_REPORTS_KEY, JSON.stringify(reports));
}

/** Check if user is online */
export function isOnline(): boolean {
  return navigator.onLine;
}

/** Register SW and setup sync */
export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Registered:', registration.scope);

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_REPORTS') {
          window.dispatchEvent(new CustomEvent('sync-offline-reports'));
        }
      });
    } catch (err) {
      console.error('[SW] Registration failed:', err);
    }
  }
}

/** Request background sync */
export async function requestSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    try {
      await (registration as any).sync.register('sync-reports');
    } catch {
      console.warn('[Sync] Background sync not available');
    }
  }
}
