/**
 * The app uses the server's signed JWT as-is and never holds a server secret: no on-device
 * token decryption, no secret values in the app env (everything there ships in the bundle).
 */
const fs = require('fs');
const path = require('path');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const AsyncStorage = require('@react-native-async-storage/async-storage');
const { getHeaders, isLegacyEncryptedToken } = require('../src/helpers/auth.helper');

const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.c2lnbmF0dXJl';
const LEGACY = 'aXZpdml2aXZpdml2aXY=:dGFndGFndGFndGFn:Y2lwaGVydGV4dA==';

describe('getHeaders', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  test('returns a stored signed JWT unchanged', async () => {
    await AsyncStorage.setItem('token', JWT);
    await expect(getHeaders()).resolves.toEqual({ token: JWT });
  });

  test('no stored token -> null', async () => {
    await expect(getHeaders()).resolves.toEqual({ token: null });
  });

  test('legacy encrypted token -> null and removed (fail closed, re-login)', async () => {
    await AsyncStorage.setItem('token', LEGACY);
    await expect(getHeaders()).resolves.toEqual({ token: null });
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
    await expect(AsyncStorage.getItem('token')).resolves.toBeNull();
  });

  test('legacy shape detection does not match a JWT', () => {
    expect(isLegacyEncryptedToken(JWT)).toBe(false);
    expect(isLegacyEncryptedToken(LEGACY)).toBe(true);
  });
});

describe('no server signing secret in the app', () => {
  const ROOT = path.join(__dirname, '..');
  const walk = dir =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
    );
  const src = walk(path.join(ROOT, 'src')).filter(f => /\.(js|jsx|ts|tsx)$/.test(f));

  test('no source file imports @env secrets or decrypts tokens', () => {
    const bad = src.filter(f =>
      /JWT_SECRET|decryptToken|createDecipheriv|from ['"]@env['"]/.test(fs.readFileSync(f, 'utf8')),
    );
    expect(bad.map(f => path.relative(ROOT, f))).toEqual([]);
  });

  test('.env.example declares no secret variables', () => {
    const vars = fs
      .readFileSync(path.join(ROOT, '.env.example'), 'utf8')
      .split('\n')
      .filter(l => /^\s*[A-Za-z_]\w*\s*=/.test(l));
    expect(vars.filter(l => /SECRET|PASSWORD|KEY|TOKEN/i.test(l))).toEqual([]);
  });
});
