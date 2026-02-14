import { jwtDecode } from 'jwt-decode';
import { getHeaders } from './auth.helper';

/**
 * Get decoded JWT payload (userDetail) from token.
 * Contains user info (e.g., id, email, roles, exp).
 * @returns {Promise<object|null>}
 */
export const getMemberDetail = async () => {
  try {
    const res = await getHeaders();
    if (!res?.token) return null;

    let cleanToken = (res.token || '').replace(/^Bearer\s+/i, '').trim();
    if (!cleanToken) return null;

    const decoded = jwtDecode(cleanToken);
    return decoded;
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
};
