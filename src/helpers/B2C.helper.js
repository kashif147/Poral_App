import { generatePKCE } from "./crypt.helper";
import { setVerifier } from "./verifier.helper";

export const microSoftUrlRedirect = async () => {
  const { code_verifier, code_challenge } = await generatePKCE();
  setVerifier(code_verifier)
  const authUrl = new URL(
    "https://projectshellAB2C.b2clogin.com/projectshellAB2C.onmicrosoft.com/oauth2/v2.0/authorize"
  );
  authUrl.searchParams.append("p", "B2C_1_projectshell");
  authUrl.searchParams.append("client_id", "e9460e2d-29d1-4711-be7e-e1e92d1370ef");
  authUrl.searchParams.append("nonce", "defaultNonce");
  authUrl.searchParams.append("redirect_uri", "http://localhost:3000");
  authUrl.searchParams.append("scope", "openid profile offline_access");
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("prompt", "login");
  authUrl.searchParams.append("code_challenge", code_challenge);
  authUrl.searchParams.append("code_challenge_method", "S256");
  window.location.href = authUrl.toString();
};