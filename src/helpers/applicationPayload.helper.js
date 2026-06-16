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

export const detailBelongsToApplication = (detail, applicationId) =>
  Boolean(
    applicationId &&
      detail?.applicationId &&
      String(detail.applicationId) === String(applicationId),
  );

export const isActiveApplicationPersonalDetail = personalDetail => {
  if (!personalDetail) return false;

  const isActive = coalesce(
    personalDetail?.meta?.isActive,
    personalDetail?.isActive,
  );

  return isActive !== false;
};

const RESUMABLE_PORTAL_APPLICATION_STATUSES = new Set([
  'rejected',
  'in-progress',
  'in progress',
]);

export const isResumablePortalApplication = (
  personalDetail,
  applicationStatus,
) => {
  if (!personalDetail?.applicationId) return false;

  const status = String(
    coalesce(personalDetail.applicationStatus, applicationStatus) || '',
  )
    .trim()
    .toLowerCase();

  if (RESUMABLE_PORTAL_APPLICATION_STATUSES.has(status)) {
    return true;
  }

  if (status === 'approved' || status === 'submitted') {
    return isActiveApplicationPersonalDetail(personalDetail);
  }

  if (!isActiveApplicationPersonalDetail(personalDetail)) {
    return true;
  }

  return true;
};

export const normalizePortalPersonalDetail = (
  personalDetail,
  applicationStatus,
) => {
  if (!personalDetail) return null;
  if (isResumablePortalApplication(personalDetail, applicationStatus)) {
    return personalDetail;
  }

  // Inactive/cancelled applications start fresh; basic info comes from auth user.
  return null;
};

export const buildDefaultPersonalInfoFromAuth = ({ user = {}, userDetail = {} } = {}) => {
  const source = { ...userDetail, ...user };

  return {
    title: '',
    forename: coalesce(source.firstName, source.userFirstName, '') || '',
    surname: coalesce(source.lastName, source.userLastName, '') || '',
    gender: '',
    dob: '',
    countryPrimaryQualification: '',
    personalEmail: coalesce(source.email, source.userEmail, '') || '',
    mobileNo:
      coalesce(source.mobilePhone, source.userMobilePhone, source.mobile, '') ||
      '',
    country: 'Ireland',
    consent: true,
    addressLine1: '',
    addressLine2: '',
    addressLine3: '',
    addressLine4: '',
    eircode: '',
    workTel: '',
    preferredEmail: '',
    preferredAddress: '',
    homeWorkTelNo: '',
    workEmail: '',
  };
};

export const resolveApplicationFormStep = ({
  activeSubscriptionDetail,
  activeProfessionalDetail,
  activeApplicationId,
} = {}) => {
  if (activeSubscriptionDetail?.applicationId) {
    return 3;
  }

  if (activeProfessionalDetail?.applicationId) {
    return 3;
  }

  if (activeApplicationId) {
    return 2;
  }

  return 1;
};

export const normalizeApplicationStatus = status =>
  String(status || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ');

export const isTerminalApplicationReviewStatus = status => {
  const normalized = normalizeApplicationStatus(status);
  return (
    normalized === 'submitted' ||
    normalized === 'approved' ||
    normalized === 'in review'
  );
};

export const getApplicationFormProgress = ({
  personalDetail,
  professionalDetail,
  subscriptionDetail,
  applicationStatus,
} = {}) => {
  const applicationId = isResumablePortalApplication(
    personalDetail,
    applicationStatus ?? personalDetail?.applicationStatus,
  )
    ? personalDetail?.applicationId
    : null;

  if (!applicationId) {
    return { completedSteps: 0, totalSteps: 3, applicationId: null };
  }

  let completedSteps = 1;

  if (detailBelongsToApplication(professionalDetail, applicationId)) {
    completedSteps = 2;
  }

  if (detailBelongsToApplication(subscriptionDetail, applicationId)) {
    completedSteps = 3;
  }

  return { completedSteps, totalSteps: 3, applicationId };
};

export const shouldShowApplicationReviewStatus = ({
  applicationStatus,
  isApplicationSubmitted = false,
  personalDetail,
  professionalDetail,
  subscriptionDetail,
} = {}) => {
  if (isApplicationSubmitted) {
    return true;
  }

  const normalized = normalizeApplicationStatus(applicationStatus);
  if (!isTerminalApplicationReviewStatus(normalized)) {
    return false;
  }

  const { completedSteps, totalSteps } = getApplicationFormProgress({
    personalDetail,
    professionalDetail,
    subscriptionDetail,
    applicationStatus,
  });

  return completedSteps >= totalSteps;
};

export const getApplicationReviewStatusKey = applicationStatus => {
  const normalized = normalizeApplicationStatus(applicationStatus);
  if (normalized === 'approved') return 'approved';
  if (normalized === 'in review') return 'in_review';
  return 'submitted';
};

export const getApplicationCompletionPercentage = ({
  personalDetail,
  professionalDetail,
  subscriptionDetail,
  applicationStatus,
  isApplicationSubmitted = false,
} = {}) => {
  if (isApplicationSubmitted) {
    return 100;
  }

  const { completedSteps } = getApplicationFormProgress({
    personalDetail,
    professionalDetail,
    subscriptionDetail,
    applicationStatus,
  });

  if (completedSteps === 0) return 0;
  if (completedSteps === 1) return 33;
  if (completedSteps === 2) return 67;
  return 90;
};
