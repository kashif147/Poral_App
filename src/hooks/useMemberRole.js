import { useSelector } from 'react-redux';
import { useProfile } from '../contexts/profileContext';
import { resolveIsPortalMember } from '../helpers/role.helper';

/**
 * Member status from JWT roles, /api/me roles, and portal profile membership.
 * @returns {{ isMember: boolean, userDetail: object }}
 */
export const useMemberRole = () => {
  const userDetail = useSelector(state => state.auth.userDetail);
  const user = useSelector(state => state.auth.user);
  const { profileDetail } = useProfile();

  const isMember = resolveIsPortalMember({
    userDetail,
    user,
    profileDetail,
  });

  return { isMember, userDetail };
};
