import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  getPendingOperations,
  removePendingOperations,
  getPendingCount,
  addOfflineOperation,
} from "@/lib/offline-db";
import {
  fetchHydrationDataApi,
  fetchCategories,
  fetchProducts,
  fetchCustomers,
  fetchExpensesApi,
  fetchMills,
  fetchPosSales,
  fetchCashTransactionsApi,
  fetchSystemLogsApi,
  getAuthHeader,
} from "@/lib/api";

const SyncContext = createContext(null);

function registerBackgroundSync() {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready
      .then((reg) => reg.sync.register("sync-offline-operations"))
      .catch(() => {});
  }
}

function getInitialBatchSize() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return 30;
  const type = conn.effectiveType;
  if (type === "slow-2g" || type === "2g" || conn.saveData) return 5;
  if (type === "3g") return 15;
  return 30;
}

function getSyncIntervalMs() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return 5000;
  const type = conn.effectiveType;
  if (type === "slow-2g" || type === "2g" || conn.saveData || (conn.rtt && conn.rtt > 1000)) return 15000;
  if (type === "3g") return 8000;
  return 5000;
}

function getNetworkSpeedName() {
  if (!navigator.onLine) return "offline";
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return "fast";
  const type = conn.effectiveType;
  if (type === "slow-2g" || type === "2g" || conn.saveData) return "slow";
  if (type === "3g") return "medium";
  return "fast";
}

function getLiveNetworkDetails() {
  if (typeof navigator === "undefined" || !navigator.onLine) {
    return { status: "offline", label: "Offline Mode", downlinkMbps: 0, rttMs: 0 };
  }
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    const downlink = conn.downlink || (conn.effectiveType === "4g" ? 25 : conn.effectiveType === "3g" ? 5 : 1);
    const rtt = conn.rtt || 28;
    const type = conn.effectiveType ? conn.effectiveType.toUpperCase() : "4G";
    const speedStr = downlink >= 1 ? `${downlink.toFixed(1)} Mbps` : `${Math.round(downlink * 1000)} Kbps`;
    return {
      status: "online",
      effectiveType: type,
      downlinkMbps: Number(downlink.toFixed(1)),
      rttMs: Math.round(rtt),
      label: `${speedStr} (${type} · ${Math.round(rtt)}ms)`,
    };
  }
  return { status: "online", effectiveType: "4G", downlinkMbps: 25.0, rttMs: 25, label: "25.0 Mbps (4G · 25ms)" };
}

export function SyncProvider({ children }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingItems, setPendingItems] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [networkSpeed, setNetworkSpeed] = useState(() => getNetworkSpeedName());
  const [networkDetails, setNetworkDetails] = useState(() => getLiveNetworkDetails());
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    return localStorage.getItem("last_sync_time") || null;
  });

  const intervalRef = useRef(null);

  const refreshCount = useCallback(async () => {
    const [count, items] = await Promise.all([getPendingCount(), getPendingOperations()]);
    setPendingCount(count);
    setPendingItems(items || []);
  }, []);

  const hydrateAllData = useCallback(async () => {
    if (!navigator.onLine) return false;
    try {
      setIsHydrating(true);
      const startT = performance.now();
      const data = await fetchHydrationDataApi();
      if (!data) {
        await Promise.allSettled([
          fetchCategories(),
          fetchProducts(),
          fetchCustomers(),
          fetchExpensesApi(),
          fetchMills(),
          fetchPosSales(),
          fetchCashTransactionsApi(),
          fetchSystemLogsApi(),
        ]);
      }
      const durMs = Math.max(10, Math.round(performance.now() - startT));
      const live = getLiveNetworkDetails();
      const calculatedSpeed = Math.min(100, Math.max(1, ((500 * 8) / (durMs / 1000) / 1024))).toFixed(1);
      setNetworkDetails({
        ...live,
        rttMs: durMs,
        label: `${calculatedSpeed} Mbps (Live Sync · ${durMs}ms)`,
      });

      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem("last_sync_time", now);
      return true;
    } catch (err) {
      return false;
    } finally {
      setIsHydrating(false);
    }
  }, []);

  const processSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    try {
      setIsSyncing(true);
      const pending = await getPendingOperations();
      if (!pending || pending.length === 0) {
        setPendingCount(0);
        setPendingItems([]);
        return;
      }

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const expiredIds = pending
        .filter((p) => p.type === "system_log_entry" && new Date(p.payload?.createdAt || 0).getTime() < sevenDaysAgo)
        .map((p) => p.id)
        .filter(Boolean);

      if (expiredIds.length > 0) {
        await removePendingOperations(expiredIds);
      }

      const activePending = pending.filter((p) => !expiredIds.includes(p.id));
      if (activePending.length === 0) {
        await refreshCount();
        return;
      }

      const rawBatchSize = getInitialBatchSize();
      const items = activePending.slice(0, rawBatchSize);
      setSyncProgress({ current: 0, total: items.length, percentage: 0 });

      const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
      const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

      const jsonPayload = JSON.stringify({ items, operations: items });
      const payloadBytes = jsonPayload.length;
      const startT = performance.now();

      const response = await fetch(`${API_URL}/sync/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: jsonPayload,
      });

      const durMs = Math.max(10, Math.round(performance.now() - startT));
      const transferMbps = Math.min(100, Math.max(1, ((payloadBytes * 8) / (durMs / 1000) / (1024 * 1024)))).toFixed(1);
      const live = getLiveNetworkDetails();
      setNetworkDetails({
        ...live,
        rttMs: durMs,
        label: `${transferMbps} Mbps (Live Sync · ${durMs}ms)`,
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && Array.isArray(data.syncedIds) && data.syncedIds.length > 0) {
          await removePendingOperations(data.syncedIds);
          const now = new Date().toISOString();
          setLastSyncTime(now);
          localStorage.setItem("last_sync_time", now);
          setSyncProgress({ current: data.syncedIds.length, total: items.length, percentage: 100 });
        } else if (data && data.success && data.processedCount === 0 && items.length > 0) {
          const itemIds = items.map((i) => i.id).filter(Boolean);
          await removePendingOperations(itemIds);
        }
      }
      await refreshCount();
    } catch (error) {
      console.warn("Sync processing error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshCount]);

  const resetSyncTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!navigator.onLine) return;

    const intervalMs = getSyncIntervalMs();
    intervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        processSync();
      }
    }, intervalMs);
  }, [processSync]);

  useEffect(() => {
    refreshCount();
    resetSyncTimer();

    if (navigator.onLine) {
      hydrateAllData();
    }

    const periodicHydration = setInterval(() => {
      if (navigator.onLine) {
        hydrateAllData();
      }
    }, 5 * 60 * 1000);

    const updateNetworkStatus = () => {
      setNetworkSpeed(getNetworkSpeedName());
      setNetworkDetails(getLiveNetworkDetails());
      resetSyncTimer();
    };

    const handleOnline = async () => {
      setIsOnline(true);
      setNetworkSpeed(getNetworkSpeedName());
      setNetworkDetails(getLiveNetworkDetails());
      registerBackgroundSync();
      await processSync();
      await hydrateAllData();
      resetSyncTimer();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkSpeed("offline");
      setNetworkDetails({ status: "offline", label: "Offline Mode", downlinkMbps: 0, rttMs: 0 });
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      conn.addEventListener("change", updateNetworkStatus);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (conn) {
        conn.removeEventListener("change", updateNetworkStatus);
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(periodicHydration);
    };
  }, [processSync, refreshCount, resetSyncTimer, hydrateAllData]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      processSync();
    }
  }, [isOnline, pendingCount, isSyncing, processSync]);

  const queueAction = async (type, action, payload) => {
    const item = await addOfflineOperation(type, action, payload);
    await refreshCount();
    registerBackgroundSync();
    if (navigator.onLine) {
      processSync();
    }
    return item;
  };

  const triggerManualSync = async () => {
    if (!navigator.onLine) {
      return { success: false, message: "Device is currently offline" };
    }
    registerBackgroundSync();
    await processSync();
    await hydrateAllData();
    return { success: true };
  };

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        pendingCount,
        pendingItems,
        isSyncing,
        isHydrating,
        syncProgress,
        networkSpeed,
        networkDetails,
        lastSyncTime,
        queueAction,
        triggerManualSync,
        hydrateAllData,
        refreshCount,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}
