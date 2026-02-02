import { Colors } from './Styles';
import { CASE_STATUS_STYLES } from '../constants/queriesCases';

/**
 * Returns the text color for a case status
 * @param {string} status
 * @returns {string}
 */
export const getStatusColor = (status) => {
  return CASE_STATUS_STYLES[status]?.color ?? Colors.primary;
};

/**
 * Returns the background color for a case status badge
 * @param {string} status
 * @returns {string}
 */
export const getStatusBg = (status) => {
  return CASE_STATUS_STYLES[status]?.bg ?? '#E0F2FE';
};
