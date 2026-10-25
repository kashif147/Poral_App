import { B2C_FLOW_ENV } from '@env';

// Azure B2C user flows per environment. DEV and UAT share one B2C tenant, so they are separated
// only by user-flow (and API-connector) names. The build selects the set with B2C_FLOW_ENV
// ("dev" or "uat"); there is no default, so a build that forgets it fails closed instead of
// silently signing DEV users in through the UAT flows. Flow names are not secrets.
// This is the only file that may import from '@env', and only B2C_FLOW_ENV.
export const B2C_FLOWS = Object.freeze({
  dev: Object.freeze({
    signin: 'B2C_1_projectshell_signin_dev',
    signup: 'B2C_1_projectshell_signup_dev',
    gmail: 'B2C_1_projectshell_signup_signin_gmail_dev',
    default: 'B2C_1_projectshell_dev',
  }),
  uat: Object.freeze({
    signin: 'B2C_1_projectshell_signin_uat',
    signup: 'B2C_1_projectshell_signup_uat',
    gmail: 'B2C_1_projectshell_signup_signin_gmail_uat',
    default: 'B2C_1_projectshell_uat',
  }),
});

export const resolveB2CFlows = env => {
  const key = typeof env === 'string' ? env.trim().toLowerCase() : '';
  if (!Object.prototype.hasOwnProperty.call(B2C_FLOWS, key)) {
    throw new Error('B2C_FLOW_ENV must be set to "dev" or "uat" for this build');
  }
  return B2C_FLOWS[key];
};

// User flow for a sign-in mode ("signin" | "signup" | "gmail"); other modes use the
// environment's default flow, never another environment's.
export const getB2CPolicy = (mode, env = B2C_FLOW_ENV) => {
  const flows = resolveB2CFlows(env);
  return Object.prototype.hasOwnProperty.call(flows, mode) ? flows[mode] : flows.default;
};
