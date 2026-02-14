/**
 * Check if user has MEMBER role from decoded token (userDetail)
 * @param {object} userDetail - Decoded JWT payload (auth.userDetail)
 * @returns {boolean}
 */
export const hasMemberRole = userDetail => {
  return (userDetail?.roles?.some(r => r?.code === 'MEMBER') ?? false);
};
