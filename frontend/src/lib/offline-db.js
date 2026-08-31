const DB_NAME = "AlKhaleejOfflineDB";
const DB_VERSION = 2;

let dbPromise = null;

export const openOfflineDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("pending_queue")) {
        const queueStore = db.createObjectStore("pending_queue", { keyPath: "id" });
        queueStore.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("cached_snapshots")) {
        db.createObjectStore("cached_snapshots", { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });

  return dbPromise;
};

export const addOfflineOperation = async (type, action, payload) => {
  try {
    const db = await openOfflineDB();
    const item = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      action,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    await new Promise((resolve, reject) => {
      const tx = db.transaction("pending_queue", "readwrite");
      const store = tx.objectStore("pending_queue");
      const req = store.add(item);
      req.onsuccess = () => resolve(item);
      req.onerror = (e) => reject(e.target.error);
    });

    return item;
  } catch (err) {
    return null;
  }
};

export const getPendingOperations = async () => {
  try {
    const db = await openOfflineDB();
    const items = await new Promise((resolve, reject) => {
      const tx = db.transaction("pending_queue", "readonly");
      const store = tx.objectStore("pending_queue");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (e) => reject(e.target.error);
    });

    return (items || []).map((item) => ({
      ...item,
      payload: item.payload,
    }));
  } catch (err) {
    return [];
  }
};

export const removePendingOperations = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return;
  try {
    const db = await openOfflineDB();
    const tx = db.transaction("pending_queue", "readwrite");
    const store = tx.objectStore("pending_queue");
    ids.forEach((id) => store.delete(id));
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  } catch (err) {}
};

export const updateOperationAttempts = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return;
  try {
    const db = await openOfflineDB();
    const tx = db.transaction("pending_queue", "readwrite");
    const store = tx.objectStore("pending_queue");
    ids.forEach((id) => {
      const req = store.get(id);
      req.onsuccess = () => {
        const item = req.result;
        if (item) {
          item.attempts = (item.attempts || 0) + 1;
          item.lastAttemptAt = new Date().toISOString();
          if (item.attempts >= 8) {
            store.delete(id);
          } else {
            store.put(item);
          }
        }
      };
    });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
    });
  } catch (err) {}
};

export const getPendingCount = async () => {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction("pending_queue", "readonly");
      const store = tx.objectStore("pending_queue");
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    });
  } catch (err) {
    return 0;
  }
};

export const saveLocalSnapshot = async (key, data) => {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction("cached_snapshots", "readwrite");
    const store = tx.objectStore("cached_snapshots");
    store.put({ key, data, updatedAt: new Date().toISOString() });
  } catch (err) {}
};

export const bulkSaveSnapshots = async (snapshotMap) => {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction("cached_snapshots", "readwrite");
    const store = tx.objectStore("cached_snapshots");
    const now = new Date().toISOString();
    Object.entries(snapshotMap).forEach(([key, data]) => {
      store.put({ key, data, updatedAt: now });
    });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    return false;
  }
};

export const getLocalSnapshot = async (key) => {
  try {
    const db = await openOfflineDB();
    const result = await new Promise((resolve) => {
      const tx = db.transaction("cached_snapshots", "readonly");
      const store = tx.objectStore("cached_snapshots");
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.data ?? null);
      req.onerror = () => resolve(null);
    });

    if (result && typeof result === "object" && result.__encrypted) {
      return null;
    }
    return result;
  } catch (err) {
    return null;
  }
};

export const updateLocalSnapshotItem = async (key, item) => {
  try {
    const list = (await getLocalSnapshot(key)) || [];
    if (!Array.isArray(list)) return;
    const itemId = item._id || item.id;
    const idx = list.findIndex((x) => (x._id || x.id) === itemId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.unshift(item);
    }
    await saveLocalSnapshot(key, list);
  } catch (err) {}
};

export const deleteFromLocalSnapshot = async (key, itemId) => {
  try {
    const list = (await getLocalSnapshot(key)) || [];
    if (!Array.isArray(list)) return;
    const updated = list.filter((x) => (x._id || x.id) !== itemId);
    await saveLocalSnapshot(key, updated);
  } catch (err) {}
};

export const getOfflineStorageEstimate = async () => {
  try {
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const usedMB = (usage / (1024 * 1024)).toFixed(2);
      const quotaMB = (quota / (1024 * 1024)).toFixed(0);
      const percent = quota > 0 ? Math.min(100, Math.max(1, Math.round((usage / quota) * 100))) : 1;
      return { usedMB, quotaMB, percent, rawUsage: usage, rawQuota: quota };
    }
  } catch (err) {}

  return { usedMB: "0.5", quotaMB: "500", percent: 1, rawUsage: 500000, rawQuota: 500 * 1024 * 1024 };
};

export const cleanupOldOfflineCache = async (days = 30) => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  let cleanedCount = 0;
  try {
    const db = await openOfflineDB();
    const tx = db.transaction("cached_snapshots", "readwrite");
    const store = tx.objectStore("cached_snapshots");
    const req = store.openCursor();
    await new Promise((resolve) => {
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const val = cursor.value;
          if (val.updatedAt && new Date(val.updatedAt).getTime() < cutoff) {
            cursor.delete();
            cleanedCount++;
          }
          cursor.continue();
        } else {
          resolve(true);
        }
      };
      req.onerror = () => resolve(false);
    });
  } catch (err) {}

  return { success: true, cleanedCount };
};
