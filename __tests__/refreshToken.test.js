/**
 * Refresh tokens are used as issued; a legacy AES-encrypted value is never decrypted on the
 * device - it yields null so the caller signs the user out (fail closed).
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/api/auth.api', () => ({}));
jest.mock('../src/helpers/verifier.helper', () => ({ deleteVerifier: jest.fn() }));
jest.mock('../src/store/slice/auth.slice', () => ({
  setSignedIn: jest.fn(), setUser: jest.fn(), setDetail: jest.fn(),
}));
jest.mock('../src/helpers/decode.helper', () => ({ getMemberDetail: jest.fn() }));
jest.mock('../src/utils/toast.utils', () => ({ toast: jest.fn() }));

const { normalizeRefreshToken } = require('../src/services/auth.services');

describe('normalizeRefreshToken', () => {
  test('plain refresh token is returned unchanged', async () => {
    await expect(normalizeRefreshToken('opaque.refresh-token_value')).resolves.toBe(
      'opaque.refresh-token_value',
    );
  });

  test('legacy encrypted value -> null (caller signs out)', async () => {
    await expect(
      normalizeRefreshToken('aXZpdml2aXZpdml2aXY=:dGFndGFndGFndGFn:Y2lwaGVydGV4dA=='),
    ).resolves.toBeNull();
  });

  test('missing / non-string -> null', async () => {
    await expect(normalizeRefreshToken(null)).resolves.toBeNull();
    await expect(normalizeRefreshToken(42)).resolves.toBeNull();
  });
});
