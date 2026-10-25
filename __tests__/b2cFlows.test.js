/**
 * B2C user-flow selection is per build (B2C_FLOW_ENV = dev | uat) and fails closed: no default,
 * and a DEV build can never resolve a UAT flow name.
 */
const fs = require('fs');
const path = require('path');
const { B2C_FLOWS, resolveB2CFlows, getB2CPolicy } = require('../src/config/b2cFlows');

describe('B2C flow configuration', () => {
  test('DEV build uses only the _dev flows', () => {
    expect(getB2CPolicy('default', 'dev')).toBe('B2C_1_projectshell_dev');
    expect(getB2CPolicy('signup', 'dev')).toBe('B2C_1_projectshell_signup_dev');
    expect(getB2CPolicy('gmail', 'dev')).toBe('B2C_1_projectshell_signup_signin_gmail_dev');
    expect(getB2CPolicy('signin', 'dev')).toBe('B2C_1_projectshell_signin_dev');
    const uat = new Set(Object.values(B2C_FLOWS.uat));
    // UAT uses its own _uat flows (ValidateProfile-UAT), never the legacy shared flow names.
    for (const name of ['B2C_1_projectshell', 'B2C_1_projectshell_signup', 'B2C_1_projectshell_signin', 'B2C_1_projectshell_signup_signin_gmail']) expect(uat.has(name)).toBe(false);
    for (const name of uat) expect(name).toMatch(/_uat$/);
    for (const name of Object.values(B2C_FLOWS.dev)) expect(uat.has(name)).toBe(false);
  });

  test('UAT build keeps the existing flow names', () => {
    expect(resolveB2CFlows('uat')).toEqual({
      signin: 'B2C_1_projectshell_signin_uat',
      signup: 'B2C_1_projectshell_signup_uat',
      gmail: 'B2C_1_projectshell_signup_signin_gmail_uat',
      default: 'B2C_1_projectshell_uat',
    });
  });

  test('unknown mode falls back to the same environment default only', () => {
    expect(getB2CPolicy('something-else', 'dev')).toBe('B2C_1_projectshell_dev');
    expect(getB2CPolicy('toString', 'dev')).toBe('B2C_1_projectshell_dev');
  });

  test('missing or unknown B2C_FLOW_ENV fails closed', () => {
    for (const env of [undefined, null, '', 'prod', 'DEVX', 'constructor', 42]) {
      expect(() => getB2CPolicy('signin', env)).toThrow(/B2C_FLOW_ENV/);
    }
    expect(getB2CPolicy('signin', ' DEV ')).toBe('B2C_1_projectshell_signin_dev');
  });

  test('no B2C flow name is hard-coded outside src/config/b2cFlows.js', () => {
    const ROOT = path.join(__dirname, '..');
    const walk = dir =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
      );
    const files = [...walk(path.join(ROOT, 'src')), path.join(ROOT, 'App.js')].filter(f => /\.(js|jsx|ts|tsx)$/.test(f));
    const bad = files.filter(f => {
      if (f.endsWith(path.join('config', 'b2cFlows.js'))) return false;
      return fs.readFileSync(f, 'utf8').split('\n').some(l => !/^\s*\/\//.test(l) && /['"`]B2C_1_/.test(l));
    });
    expect(bad.map(f => path.relative(ROOT, f))).toEqual([]);
  });
});

describe('authorize URL uses the configured flow', () => {
  beforeEach(() => jest.resetModules());

  test('this test build has no B2C_FLOW_ENV -> authorize fails closed', async () => {
    jest.doMock('../src/helpers/crypt.helper', () => ({ generatePKCE: async () => ({ code_verifier: 'v', code_challenge: 'c' }) }));
    jest.doMock('../src/helpers/verifier.helper', () => ({ setVerifier: jest.fn() }));
    const { buildB2CAuthorizeUrl } = require('../src/helpers/b2cMobileAuthorize');
    await expect(buildB2CAuthorizeUrl('signup')).rejects.toThrow(/B2C_FLOW_ENV/);
  });

  test('DEV-configured build -> authorize URL path carries the DEV signup flow', async () => {
    jest.doMock('../src/helpers/crypt.helper', () => ({ generatePKCE: async () => ({ code_verifier: 'v', code_challenge: 'c' }) }));
    jest.doMock('../src/helpers/verifier.helper', () => ({ setVerifier: jest.fn() }));
    jest.doMock('../src/config/b2cFlows', () => {
      const real = jest.requireActual('../src/config/b2cFlows');
      return { ...real, getB2CPolicy: mode => real.getB2CPolicy(mode, 'dev') };
    });
    const { buildB2CAuthorizeUrl } = require('../src/helpers/b2cMobileAuthorize');
    const { authUrl } = await buildB2CAuthorizeUrl('signup');
    expect(new URL(authUrl).pathname).toContain('/B2C_1_projectshell_signup_dev/oauth2/v2.0/authorize');
  });
});
