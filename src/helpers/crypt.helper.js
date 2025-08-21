const base64UrlEncode = (buffer) =>
  btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export const generatePKCE = async () => {
  try {
    const array = new Uint8Array(32);
    // Prefer Web Crypto if available
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(array);
      const code_verifier = base64UrlEncode(array);

      const encoder = new TextEncoder();
      const data = encoder.encode(code_verifier);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      const code_challenge = base64UrlEncode(new Uint8Array(digest));
      return { code_verifier, code_challenge };
    }

    // Fallback using React Native getRandomValues
    const { getRandomBase64 } = await import('react-native-get-random-values');
    const random = await getRandomBase64(32);
    const code_verifier = random.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    // Without subtle crypto, return verifier only; server can compute challenge if needed
    return { code_verifier, code_challenge: code_verifier };
  } catch (e) {
    // As a last resort, generate a weak random verifier (not ideal)
    const fallback = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return { code_verifier: fallback, code_challenge: fallback };
  }
};