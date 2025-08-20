const base64UrlEncode = (buffer) =>
  btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export const generatePKCE = async () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  const code_verifier = base64UrlEncode(array);

  const encoder = new TextEncoder();
  const data = encoder.encode(code_verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  const code_challenge = base64UrlEncode(new Uint8Array(digest));

  console.log("CODE_VERIFIER=====>", code_verifier);
  console.log("CODE_CHALLENGE=====>", code_challenge);
  return { code_verifier, code_challenge }
};