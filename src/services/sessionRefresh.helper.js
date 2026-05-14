import store from '../store';
import { validation } from './auth.services';

const MIN_INTERVAL_MS = 12000;
let lastAuthRefreshAt = 0;

/**
 * Dispatches full session validation (refresh token + /api/me + JWT in Redux).
 * Debounced to avoid bursts when multiple notifications arrive.
 */
export const maybeDispatchSessionRefresh = () => {
  const now = Date.now();
  if (now - lastAuthRefreshAt < MIN_INTERVAL_MS) {
    return;
  }
  lastAuthRefreshAt = now;

  const dispatched = store.dispatch(validation());
  if (dispatched && typeof dispatched.then === 'function') {
    dispatched.catch(err => {
      console.error('[sessionRefresh] validation failed:', err);
    });
  }
};
