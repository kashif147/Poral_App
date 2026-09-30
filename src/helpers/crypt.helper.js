import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';

// Ensure Buffer exists in React Native runtime
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}

const base64UrlEncode = str =>
  str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const base64Encode = bytes => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  if (typeof btoa !== 'undefined') {
    const binaryString = String.fromCharCode(...bytes);
    return btoa(binaryString);
  }
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] || 0;
    const c = bytes[i + 2] || 0;
    const bitmap = (a << 16) | (b << 8) | c;
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i + 1 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i + 2 < bytes.length ? chars.charAt(bitmap & 63) : '=';
  }
  return result;
};

/**
 * Client-side PKCE helpers (legacy / non-login uses).
 * Login PKCE is issued by GET /pkce/generate — do not use this for B2C login.
 */
export const generatePKCE = async () => {
  try {
    const array = new Uint8Array(32);
    const crypto =
      global.crypto || (typeof window !== 'undefined' && window.crypto);
    if (crypto && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }

    const base64 = base64Encode(array);
    const code_verifier = base64UrlEncode(base64);
    const hash = CryptoJS.SHA256(code_verifier);
    const hashString = hash.toString(CryptoJS.enc.Base64);
    const code_challenge = base64UrlEncode(hashString);

    return { code_verifier, code_challenge };
  } catch (e) {
    const fallback =
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    return { code_verifier: fallback, code_challenge: fallback };
  }
};

// decryptToken (AES-256-GCM keyed off JWT_SECRET) used to live here. Removed: the
// backend now sends tokens as the signed JWT itself, not "iv:tag:data" ciphertext.
// Client-side decryption required shipping JWT_SECRET in the app bundle. The JWT's
// signature is verified server-side; see user-service auth controllers for the
// backend side of this change.
