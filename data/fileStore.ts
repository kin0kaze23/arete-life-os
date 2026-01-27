const DB_NAME = 'arete-file-store';
const STORE_NAME = 'files';
const VERSION = 2; // Bumped for encrypted storage

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

// Encryption helpers using AES-256-GCM (same as vault)
const encryptBlob = async (key: CryptoKey, blob: Blob): Promise<Blob> => {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await blob.arrayBuffer();
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  // Prepend IV (12 bytes) to encrypted data for decryption
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), 12);
  return new Blob([combined], { type: 'application/octet-stream' });
};

const decryptBlob = async (key: CryptoKey, blob: Blob, originalType?: string): Promise<Blob> => {
  const data = await blob.arrayBuffer();
  const iv = new Uint8Array(data.slice(0, 12));
  const encrypted = data.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new Blob([decrypted], { type: originalType || 'application/octet-stream' });
};

/**
 * Store a file in IndexedDB with optional encryption.
 * If encryptionKey is provided, the file is encrypted before storage.
 */
export const putFile = async (key: string, file: Blob, encryptionKey?: CryptoKey) => {
  const db = await openDb();
  const dataToStore = encryptionKey ? await encryptBlob(encryptionKey, file) : file;

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    // Store metadata alongside encrypted blob for decryption
    const record = encryptionKey
      ? { blob: dataToStore, encrypted: true, originalType: file.type, originalSize: file.size }
      : { blob: file, encrypted: false };
    tx.objectStore(STORE_NAME).put(record, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Retrieve a file from IndexedDB with optional decryption.
 * If decryptionKey is provided and file was encrypted, it will be decrypted.
 */
export const getFile = async (key: string, decryptionKey?: CryptoKey) => {
  const db = await openDb();
  return new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = async () => {
      const result = request.result;
      if (!result) {
        resolve(null);
        return;
      }

      // Handle both old (plain Blob) and new (record with metadata) formats
      if (result instanceof Blob) {
        // Legacy unencrypted file - return as-is
        resolve(result);
        return;
      }

      if (result.encrypted && decryptionKey) {
        try {
          const decrypted = await decryptBlob(decryptionKey, result.blob, result.originalType);
          resolve(decrypted);
        } catch {
          // Decryption failed - return null
          resolve(null);
        }
      } else if (result.encrypted && !decryptionKey) {
        // Encrypted but no key provided - return null
        resolve(null);
      } else {
        // Not encrypted
        resolve(result.blob || null);
      }
    };
    request.onerror = () => reject(request.error);
  });
};

export const deleteFile = async (key: string) => {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * List all file keys in the store (for export purposes)
 */
export const listFileKeys = async (): Promise<string[]> => {
  const db = await openDb();
  return new Promise<string[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAllKeys();
    request.onsuccess = () => resolve(request.result as string[]);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Export all files as an array of { key, data } for backup
 * Files are already encrypted in storage, so we export them as-is
 */
export const exportAllFiles = async (): Promise<{ key: string; data: string }[]> => {
  const db = await openDb();
  const keys = await listFileKeys();
  const files: { key: string; data: string }[] = [];

  for (const key of keys) {
    const record = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (record) {
      // Convert blob to base64 for JSON serialization
      const blob = record instanceof Blob ? record : record.blob;
      if (blob) {
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        files.push({
          key,
          data: JSON.stringify({
            blob: base64,
            encrypted: record.encrypted || false,
            originalType: record.originalType,
            originalSize: record.originalSize,
          }),
        });
      }
    }
  }

  return files;
};

/**
 * Import files from backup
 */
export const importAllFiles = async (files: { key: string; data: string }[]): Promise<void> => {
  const db = await openDb();

  for (const { key, data } of files) {
    try {
      const parsed = JSON.parse(data);
      const binaryString = atob(parsed.blob);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/octet-stream' });

      const record = {
        blob,
        encrypted: parsed.encrypted || false,
        originalType: parsed.originalType,
        originalSize: parsed.originalSize,
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(record, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Skip invalid entries
    }
  }
};

/**
 * Clear all files from the store
 */
export const clearAllFiles = async (): Promise<void> => {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
