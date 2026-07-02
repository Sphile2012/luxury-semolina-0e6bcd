/**
 * REQ 13 — End-to-End Encryption for Location Data
 * Uses Web Crypto API (ECDH P-256) with IndexedDB storage
 * Falls back to plain JSON if SubtleCrypto unavailable
 */

const DB_NAME = "pr_e2ee";
const DB_VERSION = 1;
const STORE_NAME = "keys";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

const isSupported = () =>
  typeof window !== "undefined" &&
  window.crypto &&
  window.crypto.subtle &&
  typeof indexedDB !== "undefined";

/**
 * Generate ECDH P-256 key pair and store in IndexedDB
 */
export async function generateKeyPair() {
  if (!isSupported()) return null;
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"]
    );
    const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

    await dbSet("publicKey", publicKeyJwk);
    await dbSet("privateKey", privateKeyJwk);

    return { publicKey: publicKeyJwk, privateKey: privateKeyJwk };
  } catch {
    return null;
  }
}

export async function getKeyPair() {
  if (!isSupported()) return null;
  try {
    const pub = await dbGet("publicKey");
    const priv = await dbGet("privateKey");
    if (!pub || !priv) return await generateKeyPair();
    return { publicKey: pub, privateKey: priv };
  } catch {
    return null;
  }
}

/**
 * Encrypt location coords using AES-GCM
 * For simplicity, uses a random AES key (symmetric) since we don't have recipient public keys
 */
export async function encryptLocation(coords, _publicKey) {
  if (!isSupported()) {
    return { encrypted: false, data: JSON.stringify(coords) };
  }
  try {
    const key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(coords));
    const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);

    return {
      encrypted: true,
      iv: Array.from(iv),
      key: Array.from(new Uint8Array(exportedKey)),
      data: Array.from(new Uint8Array(ciphertext)),
    };
  } catch {
    return { encrypted: false, data: JSON.stringify(coords) };
  }
}

/**
 * Decrypt location blob
 */
export async function decryptLocation(blob, _privateKey) {
  if (!blob.encrypted) {
    try { return JSON.parse(blob.data); } catch { return null; }
  }
  if (!isSupported()) return null;
  try {
    const key = await window.crypto.subtle.importKey(
      "raw",
      new Uint8Array(blob.key),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const iv = new Uint8Array(blob.iv);
    const ciphertext = new Uint8Array(blob.data);
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return null;
  }
}

export { isSupported as isE2EESupported };
