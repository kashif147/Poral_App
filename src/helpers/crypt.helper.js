import 'react-native-get-random-values';
import CryptoJS from 'crypto-js';
import QuickCrypto from 'react-native-quick-crypto';
import { Buffer } from 'buffer';
import { VITE_JWT_SECRET } from '@env';

// Ensure Buffer exists in React Native runtime
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}

// Access webcrypto from QuickCrypto
const webcrypto = QuickCrypto.webcrypto;

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

// Base64 decode for React Native compatibility
const base64Decode = (base64) => {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  } else if (typeof atob !== 'undefined') {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } else {
    // Fallback implementation
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let bufferLength = base64.length * 0.75;
    if (base64[base64.length - 1] === '=') {
      bufferLength--;
      if (base64[base64.length - 2] === '=') {
        bufferLength--;
      }
    }
    const bytes = new Uint8Array(bufferLength);
    let p = 0;
    for (let i = 0; i < base64.length; i += 4) {
      const encoded1 = chars.indexOf(base64[i]);
      const encoded2 = chars.indexOf(base64[i + 1]);
      const encoded3 = chars.indexOf(base64[i + 2]);
      const encoded4 = chars.indexOf(base64[i + 3]);
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
      if (p < bufferLength) bytes[p++] = (bitmap >> 16) & 255;
      if (p < bufferLength) bytes[p++] = (bitmap >> 8) & 255;
      if (p < bufferLength) bytes[p++] = bitmap & 255;
    }
    return bytes;
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

export async function decryptToken(encryptedToken) {
  try {
    const parts = encryptedToken.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const [ivBase64, authTagBase64, encrypted] = parts;
    const JWT_SECRET = VITE_JWT_SECRET;
    
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    // Decode base64 strings to Uint8Array
    const iv = base64Decode(ivBase64);
    const authTag = base64Decode(authTagBase64);
    const encryptedData = base64Decode(encrypted);
    
    // Generate salt from secret using SHA-256
    const encoder = new TextEncoder();
    const secretBuffer = encoder.encode(JWT_SECRET);
    const saltHash = await webcrypto.subtle.digest('SHA-256', secretBuffer);
    const salt = Buffer.from(new Uint8Array(saltHash));

    // Derive key using PBKDF2 (Node-compatible QuickCrypto API)
    const key = QuickCrypto.pbkdf2Sync(
      JWT_SECRET,
      salt,
      100000,
      32,
      'sha256'
    );

    // Decrypt using AES-256-GCM
    const decipher = QuickCrypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv));
    decipher.setAuthTag(Buffer.from(authTag));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData)),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

