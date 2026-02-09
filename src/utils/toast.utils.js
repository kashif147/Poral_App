import { showMessage } from 'react-native-flash-message';

const defaultDuration = 3500;

/**
 * Toast utility wrapping react-native-flash-message for reuse across the app.
 * Use instead of Alert for non-blocking feedback (validation, success, errors).
 */
export const toast = {
  success: (message, description, options = {}) => {
    showMessage({
      message: message ?? 'Success',
      description: description ?? undefined,
      type: 'success',
      duration: defaultDuration,
      ...options,
    });
  },

  error: (message, description, options = {}) => {
    showMessage({
      message: message ?? 'Error',
      description: description ?? undefined,
      type: 'danger',
      duration: defaultDuration,
      ...options,
    });
  },

  warning: (message, description, options = {}) => {
    showMessage({
      message: message ?? 'Warning',
      description: description ?? undefined,
      type: 'warning',
      duration: defaultDuration,
      ...options,
    });
  },

  info: (message, description, options = {}) => {
    showMessage({
      message: message ?? 'Info',
      description: description ?? undefined,
      type: 'info',
      duration: defaultDuration,
      ...options,
    });
  },

  /**
   * Show a generic message (default style).
   * @param {string} message - Title text
   * @param {string} [description] - Optional second line
   * @param {object} [options] - Extra showMessage options (duration, onPress, etc.)
   */
  show: (message, description, options = {}) => {
    showMessage({
      message: message ?? '',
      description: description ?? undefined,
      type: 'default',
      duration: defaultDuration,
      ...options,
    });
  },
};

export default toast;
