import { normalizeMobileToE164 } from './phone.helper';
import { isDataFormat } from './date.helper';

const orPrev = (value, fallback, empty = '') => value || fallback || empty;
const coalescePrev = (value, fallback, empty = '') =>
  value ?? fallback ?? empty;

export const assignDefinedFields = (target, fields) => {
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      target[key] = value;
    }
  });
  return target;
};

export const pickDefinedObject = fields => assignDefinedFields({}, fields);

export const createInitialApplicationFormData = user => ({
  personalInfo: {
    forename: user?.userFirstName || user?.firstName || '',
    surname: user?.userLastName || user?.lastName || '',
    personalEmail: user?.userEmail || user?.email || '',
    mobileNo: normalizeMobileToE164(
      user?.userMobilePhone || user?.mobilePhone || '',
    ),
    country: 'Ireland',
    consent: true,
  },
  professionalDetails: {},
  subscriptionDetails: {},
});

export const buildApplicationPersonalInfo = (personalDetail, prev = {}) => {
  const personal = personalDetail?.personalInfo || {};
  const contact = personalDetail?.contactInfo || {};

  return {
    title: orPrev(personal.title, prev.title),
    surname: orPrev(personal.surname, prev.surname),
    forename: orPrev(personal.forename, prev.forename),
    gender: orPrev(personal.gender, prev.gender),
    dateOfBirth: orPrev(personal.dateOfBirth, prev.dateOfBirth),
    dob: orPrev(personal.dateOfBirth, prev.dob, prev.dateOfBirth),
    countryPrimaryQualification: orPrev(
      personal.countryPrimaryQualification,
      prev.countryPrimaryQualification,
    ),
    personalEmail: orPrev(contact.personalEmail, prev.personalEmail),
    mobileNo:
      normalizeMobileToE164(contact.mobileNumber || prev.mobileNo || '') ||
      prev.mobileNo ||
      '',
    consent: coalescePrev(contact.consent, prev.consent, false),
    addressLine1: orPrev(contact.buildingOrHouse, prev.addressLine1),
    addressLine2: orPrev(contact.streetOrRoad, prev.addressLine2),
    addressLine3: orPrev(contact.areaOrTown, prev.addressLine3),
    addressLine4: orPrev(contact.countyCityOrPostCode, prev.addressLine4),
    eircode: orPrev(contact.eircode, prev.eircode),
    preferredAddress: orPrev(contact.preferredAddress, prev.preferredAddress),
    preferredEmail: orPrev(contact.preferredEmail, prev.preferredEmail),
    homeWorkTelNo: orPrev(contact.telephoneNumber, prev.homeWorkTelNo),
    country: orPrev(contact.country, prev.country, 'Ireland'),
    workEmail: orPrev(contact.workEmail, prev.workEmail),
    // Registration professional fields (persisted via professional-details API)
    workLocation: orPrev(prev.workLocation, ''),
    otherWorkLocation: coalescePrev(prev.otherWorkLocation, ''),
    grade: orPrev(prev.grade, ''),
    otherGrade: coalescePrev(prev.otherGrade, ''),
    nmbiNumber: coalescePrev(prev.nmbiNumber, prev.nmbiNo, ''),
    nmbiNo: coalescePrev(prev.nmbiNo, prev.nmbiNumber, ''),
  };
};

export const buildPersonalDetailPayload = data => ({
  personalInfo: pickDefinedObject({
    title: data.title,
    surname: data.surname,
    forename: data.forename,
    gender: data.gender,
    dateOfBirth: isDataFormat(data.dateOfBirth || data.dob),
    countryPrimaryQualification: data.countryPrimaryQualification,
  }),
  contactInfo: pickDefinedObject({
    preferredAddress: data.preferredAddress,
    eircode: data.eircode,
    buildingOrHouse: data.addressLine1,
    streetOrRoad: data.addressLine2,
    areaOrTown: data.addressLine3,
    countyCityOrPostCode: data.addressLine4,
    country: data.country,
    mobileNumber: normalizeMobileToE164(data.mobileNo),
    telephoneNumber: data.homeWorkTelNo,
    preferredEmail: data.preferredEmail,
    personalEmail: data.personalEmail,
    workEmail: data.workEmail,
    consent: data.consent,
  }),
});

/** Subset used by event/course registration personal-info gate. */
export const buildRegistrationProfessionalFields = (
  professionalDetail,
  prev = {},
) => {
  const details =
    professionalDetail?.professionalDetails || professionalDetail || {};

  return {
    workLocation: orPrev(details.workLocation, prev.workLocation),
    otherWorkLocation: coalescePrev(
      details.otherWorkLocation,
      prev.otherWorkLocation,
    ),
    grade: orPrev(details.grade, prev.grade),
    otherGrade: coalescePrev(details.otherGrade, prev.otherGrade),
    nmbiNumber: coalescePrev(details.nmbiNumber, prev.nmbiNumber, prev.nmbiNo),
    nmbiNo: coalescePrev(details.nmbiNumber, prev.nmbiNo, prev.nmbiNumber),
  };
};

export const buildRegistrationProfessionalPayload = data => ({
  professionalDetails: pickDefinedObject({
    workLocation: data.workLocation,
    otherWorkLocation: data.otherWorkLocation,
    grade: data.grade,
    otherGrade: data.otherGrade,
    nmbiNumber: data.nmbiNumber || data.nmbiNo,
  }),
});

/** Prefill registration personal form from profile-service data. */
export const buildRegistrationFormFromProfileSources = ({
  profileDetail = null,
  profileByIdDetail = null,
  user = null,
  prev = {},
} = {}) => {
  const personal = profileByIdDetail?.personalInfo || {};
  const contact = profileByIdDetail?.contactInfo || {};
  const professional =
    profileByIdDetail?.professionalDetails ||
    profileByIdDetail?.professionalInfo ||
    {};
  const flat = profileDetail || {};

  return {
    ...prev,
    profileId: flat.profileId || prev.profileId || '',
    title: orPrev(personal.title, prev.title),
    forename: orPrev(
      personal.forename,
      orPrev(flat.firstName, user?.userFirstName || user?.firstName || prev.forename),
    ),
    surname: orPrev(
      personal.surname,
      orPrev(flat.lastName, user?.userLastName || user?.lastName || prev.surname),
    ),
    gender: orPrev(personal.gender, prev.gender),
    dateOfBirth: orPrev(personal.dateOfBirth, prev.dateOfBirth),
    dob: orPrev(personal.dateOfBirth, prev.dob || prev.dateOfBirth),
    countryPrimaryQualification: orPrev(
      personal.countryPrimaryQualification,
      prev.countryPrimaryQualification,
    ),
    personalEmail: orPrev(
      contact.personalEmail,
      orPrev(flat.email, user?.userEmail || user?.email || prev.personalEmail),
    ),
    mobileNo:
      normalizeMobileToE164(
        contact.mobileNumber ||
          flat.phone ||
          prev.mobileNo ||
          user?.userMobilePhone ||
          user?.mobilePhone ||
          '',
      ) ||
      prev.mobileNo ||
      '',
    preferredAddress: orPrev(contact.preferredAddress, prev.preferredAddress),
    preferredEmail: orPrev(contact.preferredEmail, prev.preferredEmail),
    workEmail: orPrev(contact.workEmail, prev.workEmail),
    homeWorkTelNo: orPrev(contact.telephoneNumber, prev.homeWorkTelNo),
    consent: coalescePrev(contact.consent, prev.consent, true),
    addressLine1: orPrev(
      contact.buildingOrHouse,
      orPrev(flat.addressLine1, prev.addressLine1),
    ),
    addressLine2: orPrev(
      contact.streetOrRoad,
      orPrev(flat.addressLine2, prev.addressLine2),
    ),
    addressLine3: orPrev(
      contact.areaOrTown,
      orPrev(flat.townCity, prev.addressLine3),
    ),
    addressLine4: orPrev(
      contact.countyCityOrPostCode,
      orPrev(flat.countyState, prev.addressLine4),
    ),
    eircode: orPrev(contact.eircode, orPrev(flat.eircode, prev.eircode)),
    country: orPrev(
      contact.country,
      orPrev(flat.country, prev.country || 'Ireland'),
    ),
    workLocation: orPrev(
      professional.workLocation,
      orPrev(flat.workLocation, prev.workLocation),
    ),
    otherWorkLocation: coalescePrev(
      professional.otherWorkLocation,
      prev.otherWorkLocation,
    ),
    grade: orPrev(professional.grade, orPrev(flat.grade, prev.grade)),
    otherGrade: coalescePrev(professional.otherGrade, prev.otherGrade),
    nmbiNumber: coalescePrev(
      professional.nmbiNumber,
      prev.nmbiNumber || prev.nmbiNo,
    ),
    nmbiNo: coalescePrev(
      professional.nmbiNumber,
      prev.nmbiNo || prev.nmbiNumber,
    ),
  };
};

export const getRegistrationProfessionalMissingFields = (data = {}) => {
  const missing = [];
  if (!data.workLocation) missing.push('Work location');
  if (
    data.workLocation === 'other' &&
    !String(data.otherWorkLocation || '').trim()
  ) {
    missing.push('Other work location');
  }
  if (!data.grade) missing.push('Grade');
  if (data.grade === 'other' && !String(data.otherGrade || '').trim()) {
    missing.push('Other grade');
  }
  return missing;
};

export const validateRegistrationProfessionalFields = data =>
  getRegistrationProfessionalMissingFields(data).length === 0;

export const hasRegistrationProfessionalInformation = professionalDetail => {
  const fields = buildRegistrationProfessionalFields(professionalDetail);
  return validateRegistrationProfessionalFields(fields);
};

export const validateApplicationStep = ({
  currentStep,
  personalInfo = {},
}) => {
  if (currentStep === 1) {
    const {
      title,
      forename,
      surname,
      gender,
      dateOfBirth,
      dob,
      personalEmail,
      workEmail,
      mobileNo,
      addressLine1,
      addressLine4,
      preferredAddress,
      preferredEmail,
      countryPrimaryQualification,
    } = personalInfo;

    if (!preferredEmail) return false;

    const emailMissing =
      preferredEmail === 'personal'
        ? !personalEmail
        : preferredEmail === 'work'
          ? !workEmail
          : true;

    return Boolean(
      title &&
        forename &&
        surname &&
        gender &&
        (dateOfBirth || dob) &&
        !emailMissing &&
        mobileNo &&
        addressLine1 &&
        addressLine4 &&
        preferredAddress &&
        countryPrimaryQualification,
    );
  }

  return true;
};

export const getMissingRequiredFields = ({ currentStep, personalInfo = {} }) => {
  const missing = [];

  if (currentStep === 1) {
    const {
      title,
      forename,
      surname,
      gender,
      dateOfBirth,
      dob,
      personalEmail,
      workEmail,
      mobileNo,
      addressLine1,
      addressLine4,
      preferredAddress,
      preferredEmail,
      countryPrimaryQualification,
    } = personalInfo;

    if (!preferredEmail) missing.push('Preferred email');
    if (!title) missing.push('Title');
    if (!forename) missing.push('Forename');
    if (!surname) missing.push('Surname');
    if (!gender) missing.push('Gender');
    if (!dateOfBirth && !dob) missing.push('Date of Birth');
    if (preferredEmail === 'personal' && !personalEmail) {
      missing.push('Personal email');
    }
    if (preferredEmail === 'work' && !workEmail) missing.push('Work email');
    if (
      preferredEmail &&
      preferredEmail !== 'personal' &&
      preferredEmail !== 'work' &&
      !personalEmail &&
      !workEmail
    ) {
      missing.push('Preferred email');
    }
    if (!mobileNo) missing.push('Mobile number');
    if (!addressLine1) missing.push('Address Line 1');
    if (!addressLine4) missing.push('Address Line 4');
    if (!preferredAddress) missing.push('Preferred address');
    if (!countryPrimaryQualification) {
      missing.push('Country of primary qualification');
    }
  }

  return missing;
};
