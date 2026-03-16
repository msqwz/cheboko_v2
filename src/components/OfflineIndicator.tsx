import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { Wifi, WifiOff, RefreshCw, CloudOff, Cloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUnsyncedReports } from '../lib/offlineStore';

export const OfflineIndicator: React.FC = () => {
  const { online, syncOfflineReports, currentUser } = useAppContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'engineer') {
      const reports = getUnsyncedReports();
      setUnsyncedCount(reports.length);
    }
  }, [online, currentUser]);

  // Auto-show sync success when coming back online
  useEffect(() => {
    if (online && unsyncedCount > 0) {
      handleSync();
    }
  }, [online]);

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 800)); // visual delay
    syncOfflineReports();
    setIsSyncing(false);
    setUnsyncedCount(0);
    setShowSyncSuccess(true);
    setTimeout(() => setShowSyncSuccess(false), 3000);
  };

  return (
    <>
      {/* Compact header bar indicator */}
      <AnimatePresence>
        {!online && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-500 text-white overflow-hidden"
          >
            <div className="px-4 py-1.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
              <WifiOff className="h-3.5 w-3.5 shrink-0" />
              <span>Офлайн-режим</span>
              {currentUser?.role === 'engineer' && unsyncedCount > 0 && (
                <span className="bg-amber-600 px-1.5 py-0.5 rounded text-xs">
                  {unsyncedCount} отчёт(ов) ожидают
                </span>
              )}
              {currentUser?.role === 'engineer' && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="ml-1 flex items-center gap-1 bg-amber-600 hover:bg-amber-700 px-2 py-0.5 rounded text-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Синхронизация...' : 'Повторить'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync success toast */}
      <AnimatePresence>
        {showSyncSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium"
          >
            <Cloud className="h-4 w-4" />
            Данные синхронизированы
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/** Small inline status badge for sidebar/header */
export const OnlineStatusBadge: React.FC = () => {
  const { online } = useAppContext();

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
      <span className={online ? 'text-green-600' : 'text-amber-600'}>
        {online ? 'Онлайн' : 'Офлайн'}
      </span>
    </div>
  );
};
