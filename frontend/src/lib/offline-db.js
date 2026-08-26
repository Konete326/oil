const DB_NAME = "AlKhaleejOfflineDB";
const DB_VERSION = 1;
const ENCRYPTION_SALT = "ALKHALEEJ_OFFLINE_SECURE_SALT_v1";

let dbPromise = null;

function encryptData(payload) {
  if (payload === null || payload === undefined) return payload;
  try {
    const jsonStr = JSON.stringify(payload);
    let cipher = "";
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i) ^ ENCRYPTION_SALT.charCodeAt(i % ENCRYPTION_SALT.length);
      cipher += String.fromCharCode(charCode);
    }
    return {
      __encrypted: true,
      data: btoa(encodeURIComponent(cipher)),
    };
  } catch (err) {
    return payload;
  }
}

function decryptData(payload) {
  if (!payload || typeof payload !== "object" || !payload.__encrypted || !payload.data) {
    return payload;
  }
  try {
    const cipher = decodeURIComponent(atob(payload.data));
    let jsonStr = "";
    for (let i = 0; i < cipher.length; i++) {
      const charCode = cipher.charCodeAt(i) ^ ENCRYPTION_SALT.charCodeAt(i % ENCRYPTION_SALT.length);
      jsonStr += String.fromCharCode(charCode);
    }
    return JSON.parse(jsonStr);
  } catch (err) {
    return payload;
  }
}

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
    const encryptedPayload = encryptData(payload);
    const item = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      action,
      payload: encryptedPayload,
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

    return {
      ...item,
      payload,
    };
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

    return items.map((item) => ({
      ...item,
      payload: decryptData(item.payload),
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
    const encryptedData = encryptData(data);
    const tx = db.transaction("cached_snapshots", "readwrite");
    const store = tx.objectStore("cached_snapshots");
    store.put({ key, data: encryptedData, updatedAt: new Date().toISOString() });
  } catch (err) {}
};

export const bulkSaveSnapshots = async (snapshotMap) => {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction("cached_snapshots", "readwrite");
    const store = tx.objectStore("cached_snapshots");
    const now = new Date().toISOString();
    Object.entries(snapshotMap).forEach(([key, data]) => {
      const encryptedData = encryptData(data);
      store.put({ key, data: encryptedData, updatedAt: now });
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
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });

    return decryptData(result);
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
