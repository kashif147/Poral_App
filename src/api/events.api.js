import events_request from './events_request';

const TRANSIENT_STATUSES = new Set([408, 429, 502, 503, 504]);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const isTransientFailure = response => {
  if (!response) return true;
  return TRANSIENT_STATUSES.has(Number(response.status));
};

/**
 * Retry transient events-service failures (503/502/504/network).
 * Safe for GET reads; do not use for create/update POSTs.
 */
export const withEventsRetry = async (
  requestFn,
  { retries = 3, baseDelayMs = 700 } = {},
) => {
  let lastResponse;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await requestFn();
      lastResponse = response;

      if (!isTransientFailure(response) || attempt === retries) {
        return response;
      }
    } catch (error) {
      lastResponse = error?.response || null;
      if (attempt === retries) {
        throw error;
      }
      if (lastResponse && !isTransientFailure(lastResponse)) {
        throw error;
      }
    }

    await sleep(baseDelayMs * 2 ** attempt);
  }

  return lastResponse;
};

export const fetchEventsRequest = (params = {}) => {
  const {
    status = '',
    from = '',
    to = '',
    q = '',
    eventCategoryCode = '',
  } = params;

  return withEventsRetry(() =>
    events_request.get('/api/events', {
      params: {
        status,
        from,
        to,
        q,
        eventCategoryCode,
      },
    }),
  );
};

export const fetchPublishedEvents = (params = {}) =>
  fetchEventsRequest({
    ...params,
    eventCategoryCode: 'EVENT',
    status: 'Published',
  });

export const fetchPublishedCourses = (params = {}) =>
  fetchEventsRequest({
    ...params,
    eventCategoryCode: 'CPD',
    status: 'Published',
  });

export const createRegistrationRequest = data =>
  events_request.post('/api/registrations', data);

export const fetchProfileRegistrations = profileId =>
  withEventsRetry(() =>
    events_request.get(`/api/registrations/profile/${profileId}`),
  );

export const fetchMyRegistrations = profileId =>
  profileId
    ? fetchProfileRegistrations(profileId)
    : Promise.resolve(null);
