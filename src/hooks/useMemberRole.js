import { useSelector } from 'react-redux';
import { hasMemberRole } from '../helpers/role.helper';

/**
 * Hook to get member status from JWT token roles
 * @returns {{ isMember: boolean, userDetail: object }}
 */
export const useMemberRole = () => {
  const userDetail = useSelector(state => state.auth.userDetail);
  const isMember = hasMemberRole(userDetail);
  return { isMember, userDetail };
};
