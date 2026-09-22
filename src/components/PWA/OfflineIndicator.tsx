import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      // Just reconnected
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-600 text-white shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-5">
        <WifiOff className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
        <div className="flex-1">
          <span className="font-bold">Mode Offline Aktif</span> — Data tersimpan di perangkat lokal & siap digunakan di lapangan tanpa sinyal.
        </div>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-5">
        <Wifi className="w-4 h-4 shrink-0 text-emerald-200" />
        <div className="flex-1">
          <span className="font-bold">Koneksi Internet Kembali</span> — Sistem terhubung secara online.
        </div>
      </div>
    );
  }

  return null;
};
