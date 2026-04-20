const coalesce = (...vals) => {
  for (let i = 0; i < vals.length; i += 1) {
    const v = vals[i];
    if (v !== null && v !== undefined) return v;
  }
  return undefined;
};

const wrapProfessionalDetail = raw => {
  if (!raw) return null;
  if (
    raw.professionalDetails != null &&
    typeof raw.professionalDetails === 'object'
  ) {
    return raw;
  }
  return { professionalDetails: raw };
};

const wrapSubscriptionDetail = raw => {
  if (!raw) return null;
  if (
    raw.subscriptionDetails != null &&
    typeof raw.subscriptionDetails === 'object'
  ) {
    return raw;
  }
  return { subscriptionDetails: raw };
};

export const extractApplicationsFromMeResponse = res => {
  const body = res != null ? res.data : undefined;
  const inner = coalesce(
    body != null && body.data != null ? body.data.data : undefined,
    body != null ? body.data : undefined,
    body,
  );
  const list = coalesce(
    inner != null ? inner.applications : undefined,
    body != null && body.data != null ? body.data.applications : undefined,
    body != null && body.data != null && body.data.data != null
      ? body.data.data.applications
      : undefined,
    body != null ? body.applications : undefined,
    Array.isArray(inner) ? inner : null,
  );
  return Array.isArray(list) ? list : [];
};

export const normalizeApplicationDetailResponse = (res, listRow = {}) => {
  const root = coalesce(
    res != null && res.data != null ? res.data.data : undefined,
    res != null ? res.data : undefined,
    res,
  );
  const payload =
    root &&
    typeof root === 'object' &&
    root.data &&
    root.personalDetail == null &&
    root.personalDetails == null
      ? root.data
      : root;

  let personalDetail = coalesce(
    payload != null ? payload.personalDetail : undefined,
    payload != null ? payload.personalDetails : undefined,
    null,
  );
  const professionalDetail = wrapProfessionalDetail(
    coalesce(
      payload != null ? payload.professionalDetail : undefined,
      payload != null ? payload.professionalDetails : undefined,
      null,
    ),
  );
  const subscriptionDetail = wrapSubscriptionDetail(
    coalesce(
      payload != null ? payload.subscriptionDetail : undefined,
      payload != null ? payload.subscriptionDetails : undefined,
      null,
    ),
  );

  if (
    personalDetail &&
    listRow.applicationStatus != null &&
    personalDetail.applicationStatus == null
  ) {
    personalDetail = {
      ...personalDetail,
      applicationStatus: listRow.applicationStatus,
    };
  }

  if (
    subscriptionDetail &&
    subscriptionDetail.subscriptionDetails &&
    listRow.membershipCategory != null &&
    subscriptionDetail.subscriptionDetails.membershipCategory == null
  ) {
    subscriptionDetail.subscriptionDetails = {
      ...subscriptionDetail.subscriptionDetails,
      membershipCategory: listRow.membershipCategory,
    };
  }

  const applicationIdRaw = coalesce(
    listRow.applicationId,
    payload != null ? payload.applicationId : undefined,
    personalDetail != null ? personalDetail.applicationId : undefined,
  );
  const submissionDateRaw = coalesce(
    listRow.submissionDate,
    payload != null ? payload.submissionDate : undefined,
    personalDetail != null ? personalDetail.submissionDate : undefined,
  );

  const out = {
    applicationId:
      applicationIdRaw !== undefined && applicationIdRaw !== null
        ? applicationIdRaw
        : null,
    submissionDate:
      submissionDateRaw !== undefined && submissionDateRaw !== null
        ? submissionDateRaw
        : null,
    personalDetail,
    professionalDetail,
    subscriptionDetail,
  };

  const hasAny =
    (personalDetail && Object.keys(personalDetail).length > 0) ||
    (professionalDetail && Object.keys(professionalDetail).length > 0) ||
    (subscriptionDetail && Object.keys(subscriptionDetail).length > 0);

  return hasAny ? out : null;
};

export const applicationDetailHasSections = app =>
  Boolean(
    app &&
      app.personalDetail &&
      app.professionalDetail &&
      app.subscriptionDetail,
  );

export const buildApplicationBundleFromContext = ({
  personalDetail,
  professionalDetail,
  subscriptionDetail,
}) => {
  const applicationId =
    personalDetail != null && personalDetail.applicationId != null
      ? personalDetail.applicationId
      : null;
  const submissionDateRaw = coalesce(
    personalDetail != null ? personalDetail.submissionDate : undefined,
    personalDetail != null && personalDetail.personalInfo != null
      ? personalDetail.personalInfo.submissionDate
      : undefined,
    subscriptionDetail != null &&
      subscriptionDetail.subscriptionDetails != null
      ? subscriptionDetail.subscriptionDetails.submissionDate
      : undefined,
  );

  return {
    applicationId,
    submissionDate:
      submissionDateRaw !== undefined && submissionDateRaw !== null
        ? submissionDateRaw
        : null,
    personalDetail: personalDetail || null,
    professionalDetail: professionalDetail || null,
    subscriptionDetail: subscriptionDetail || null,
  };
};
