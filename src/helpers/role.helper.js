const normalizeRoleCode = role => {
  if (typeof role === 'string') {
    return role.trim().toUpperCase().replace(/_/g, '-');
  }

  const code = String(role?.code || '')
    .trim()
    .toUpperCase()
    .replace(/_/g, '-');
  if (code) return code;

  return String(role?.name || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');
};

const isMemberRoleValue = role => normalizeRoleCode(role) === 'MEMBER';

const isNonMemberRoleValue = role => {
  const code = normalizeRoleCode(role);
  return code === 'NON-MEMBER';
};

const hasRoleMatch = (userLike, matcher) => {
  if (!userLike) return false;

  const roles = userLike?.roles;
  if (!Array.isArray(roles)) return false;

  return roles.some(matcher);
};

/**
 * Check if user has MEMBER role from decoded token (userDetail)
 * @param {object} userDetail - Decoded JWT payload (auth.userDetail)
 * @returns {boolean}
 */
export const hasMemberRole = userDetail =>
  hasRoleMatch(userDetail, isMemberRoleValue);

/**
 * Check if user has NON-MEMBER role from auth payload (/api/me or JWT).
 * @param {object} userLike
 * @returns {boolean}
 */
export const hasNonMemberRole = userLike =>
  hasRoleMatch(userLike, isNonMemberRoleValue);

/**
 * Active portal profile with an assigned membership number.
 * @param {object} profileDetail
 * @returns {boolean}
 */
export const isActivePortalMember = profileDetail => {
  if (!profileDetail?.membershipNumber) return false;
  return profileDetail.isActive !== false;
};

/**
 * Resolve portal member status from auth roles and profile.
 * NON-MEMBER role from /api/me or JWT takes precedence over stale profile data.
 */
export const resolveIsPortalMember = ({
  userDetail,
  user,
  profileDetail,
} = {}) => {
  if (hasNonMemberRole(userDetail) || hasNonMemberRole(user)) {
    return false;
  }

  return (
    hasMemberRole(userDetail) ||
    hasMemberRole(user) ||
    isActivePortalMember(profileDetail)
  );
};

/**
 * Whether the Profile screen/nav should be available.
 * Members only — non-members manage details during event/course registration.
 */
export const canAccessProfile = ({ isMember } = {}) => Boolean(isMember);

/**
 * Whether Profile edits are locked.
 * Non-members with an active submitted/processed application can view but not save.
 * Members (and processed members using profile-service) can always edit.
 */
export const isProfileReadOnly = ({
  isMember,
  applicationStatus,
  isActive,
} = {}) => {
  if (isMember) return false;

  const status = String(applicationStatus || '')
    .trim()
    .toLowerCase();

  const isSubmittedOrProcessed =
    status === 'submitted' || status === 'processed';

  if (!isSubmittedOrProcessed) return false;

  return isActive !== false;
};
