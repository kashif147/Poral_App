import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';

const base64UrlEncode = (str) => {
  return str
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

// Base64 encode for React Native compatibility
const base64Encode = (bytes) => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  } else if (typeof btoa !== 'undefined') {
    const binaryString = String.fromCharCode(...bytes);
    return btoa(binaryString);
  } else {
    // Fallback implementation
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
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
  }
};

export const generatePKCE = async () => {
  try {
    // Generate random 32-byte array
    // react-native-get-random-values polyfills crypto.getRandomValues globally
    const array = new Uint8Array(32);
    const crypto = global.crypto || (typeof window !== 'undefined' && window.crypto);
    if (crypto && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback: use Math.random (less secure but works)
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
   
    // Convert to base64url encoded string
    const base64 = base64Encode(array);
    const code_verifier = base64UrlEncode(base64);

    // Generate code_challenge using SHA-256
    const hash = CryptoJS.SHA256(code_verifier);
    const hashString = hash.toString(CryptoJS.enc.Base64);
    const code_challenge = base64UrlEncode(hashString);

    console.log("CODE_VERIFIER=====>", code_verifier);
    console.log("CODE_CHALLENGE=====>", code_challenge);
   
    return { code_verifier, code_challenge };
  } catch (e) {
    console.error('Error generating PKCE:', e);
    // As a last resort, generate a weak random verifier (not ideal)
    const fallback = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return { code_verifier: fallback, code_challenge: fallback };
  }
};

