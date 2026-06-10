export const PAYMENT_FORM_TYPES = {
  DIRECT_DEBIT: 'DD_MANDATE',
  SALARY_DEDUCTION: 'SALARY_DEDUCTION',
  STANDING_ORDER: 'STANDING_ORDER',
};

export const FORM_TYPE_TO_TAB = {
  [PAYMENT_FORM_TYPES.DIRECT_DEBIT]: 'Direct Debit',
  [PAYMENT_FORM_TYPES.SALARY_DEDUCTION]: 'Salary Deduction',
  [PAYMENT_FORM_TYPES.STANDING_ORDER]: 'Standing Banking Order',
};

export const isPaymentApiSuccess = response =>
  response?.status >= 200 && response?.status < 300;

const pickFirstNonEmpty = (...values) => {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
};

const pickNonEmpty = (primary, fallback) => {
  const value = primary ?? fallback;
  if (value === null || value === undefined) return '';
  return String(value).trim() ? value : fallback ?? '';
};

export const normalizePaymentType = paymentType => {
  if (!paymentType) return null;
  const normalized = paymentType.toString().toLowerCase();
  const compact = normalized.replace(/[^a-z]/g, '');

  if (
    (normalized.includes('order') || compact.includes('order')) &&
    (normalized.includes('stand') ||
      compact.includes('stand') ||
      compact.includes('stan') ||
      compact.startsWith('st'))
  ) {
    return 'Standing Banking Order';
  }

  if (
    normalized.includes('standing') &&
    (normalized.includes('banker') ||
      normalized.includes('bank') ||
      normalized.includes('order'))
  ) {
    return 'Standing Banking Order';
  }

  if (normalized.includes('direct') && normalized.includes('debit')) {
    return 'Direct Debit';
  }

  if (
    (normalized.includes('salary') && normalized.includes('deduction')) ||
    normalized === 'deduction' ||
    normalized.includes('payroll')
  ) {
    return 'Salary Deduction';
  }

  return null;
};

export const getTabKeyForPortalForm = form => {
  if (!form) return null;
  return (
    FORM_TYPE_TO_TAB[form.formType] ||
    normalizePaymentType(form.formTypeLabel) ||
    normalizePaymentType(form.formType) ||
    null
  );
};

export const extractMyPortalPaymentForms = response => {
  const body = response?.data;
  if (!body || typeof body !== 'object') return [];

  let forms =
    body.data?.paymentForms ??
    body.data?.data?.paymentForms ??
    body.paymentForms ??
    body.data ??
    [];

  if (!Array.isArray(forms)) {
    if (forms?.paymentForms && Array.isArray(forms.paymentForms)) {
      forms = forms.paymentForms;
    } else if (forms && typeof forms === 'object') {
      forms = [forms];
    } else {
      forms = [];
    }
  }

  return forms.map(normalizePortalPaymentForm).filter(Boolean);
};

const sortFormsByRecent = (a, b) =>
  new Date(b?.updatedAt || b?.createdAt || 0) -
  new Date(a?.updatedAt || a?.createdAt || 0);

export const formMatchesProfilePaymentType = (form, profilePaymentTypeTab) => {
  if (!form || !profilePaymentTypeTab) return false;
  return getTabKeyForPortalForm(form) === profilePaymentTypeTab;
};

export const getActivePaymentFormForProfile = (forms, profilePaymentTypeTab) => {
  if (!Array.isArray(forms) || forms.length === 0) return null;

  const activeForms = forms.filter(
    form => String(form?.status || '').toLowerCase() === 'active',
  );

  if (activeForms.length === 0) return null;

  if (profilePaymentTypeTab) {
    const matched = activeForms
      .filter(form => formMatchesProfilePaymentType(form, profilePaymentTypeTab))
      .sort(sortFormsByRecent);
    return matched[0] ?? null;
  }

  return [...activeForms].sort(sortFormsByRecent)[0] ?? null;
};

export const formatIbanForDisplay = iban => {
  if (!iban) return '';
  const cleaned = String(iban).replace(/\s/g, '').toUpperCase();
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
};

export const extractDirectDebitMandateFields = form => {
  if (!form || typeof form !== 'object') return {};

  const nested =
    form.directDebitMandate ||
    form.mandate ||
    form.formData?.directDebitMandate ||
    form.details?.directDebitMandate ||
    {};

  return {
    debtorName: pickFirstNonEmpty(
      nested.debtorName,
      form.debtorName,
      form.memberFullName,
      form.memberName,
    ),
    debtorAddress: pickFirstNonEmpty(nested.debtorAddress, form.debtorAddress),
    debtorCity: pickFirstNonEmpty(nested.debtorCity, form.debtorCity),
    debtorPostcode: pickFirstNonEmpty(
      nested.debtorPostcode,
      nested.debtorPostCode,
      form.debtorPostcode,
      form.debtorPostCode,
    ),
    debtorCountry: pickFirstNonEmpty(
      nested.debtorCountry,
      form.debtorCountry,
      'Ireland',
    ),
    debtorIban: pickFirstNonEmpty(
      nested.debtorIban,
      nested.debtorIbanDisplay,
      form.debtorIban,
      form.debtorIbanDisplay,
    ),
    debtorBic: pickFirstNonEmpty(nested.debtorBic, form.debtorBic),
    signedDate: pickFirstNonEmpty(nested.signedDate, form.signedDate),
    isAuthorized: nested.isAuthorized ?? form.isAuthorized,
    paymentTypeRecurrent:
      nested.paymentTypeRecurrent ?? form.paymentTypeRecurrent,
    creditorName: pickFirstNonEmpty(nested.creditorName, form.creditorName),
    creditorIdentifier: pickFirstNonEmpty(
      nested.creditorIdentifier,
      form.creditorIdentifier,
    ),
    creditorAddress: pickFirstNonEmpty(
      nested.creditorAddress,
      form.creditorAddress,
    ),
    creditorCity: pickFirstNonEmpty(nested.creditorCity, form.creditorCity),
    creditorPostcode: pickFirstNonEmpty(
      nested.creditorPostcode,
      form.creditorPostcode,
    ),
    creditorCountry: pickFirstNonEmpty(
      nested.creditorCountry,
      form.creditorCountry,
    ),
    uniqueMandateReference: pickFirstNonEmpty(
      nested.uniqueMandateReference,
      form.uniqueMandateReference,
      form.membershipNumber,
    ),
  };
};

export const normalizePortalPaymentForm = form => {
  if (!form || typeof form !== 'object') return form;

  const tabKey = getTabKeyForPortalForm(form);
  if (tabKey !== 'Direct Debit' && form.formType !== PAYMENT_FORM_TYPES.DIRECT_DEBIT) {
    return form;
  }

  const mandateFields = extractDirectDebitMandateFields(form);

  return {
    ...form,
    directDebitMandate: {
      ...(form.directDebitMandate || {}),
      ...mandateFields,
    },
  };
};

export const mapDirectDebitFromMineForm = form => {
  if (!form) return {};
  const m = extractDirectDebitMandateFields(form);

  return {
    memberName: m.debtorName || '',
    memberAddress: m.debtorAddress || '',
    memberCity: m.debtorCity || '',
    memberPostCode: m.debtorPostcode || '',
    memberCountry: m.debtorCountry || 'Ireland',
    authorization: m.isAuthorized ?? false,
    signatureDate: m.signedDate || '',
    paymentType: m.paymentTypeRecurrent === false ? 'one-off' : 'recurrent',
    iban: formatIbanForDisplay(m.debtorIban || ''),
    bic: m.debtorBic || '',
  };
};

export const mapDirectDebitFromPortal = mandateOrForm => {
  if (!mandateOrForm) return {};

  const isFullDocument = Boolean(
    mandateOrForm.formType === PAYMENT_FORM_TYPES.DIRECT_DEBIT ||
      mandateOrForm._id ||
      mandateOrForm.id ||
      mandateOrForm.status ||
      getTabKeyForPortalForm(mandateOrForm) === 'Direct Debit',
  );

  if (isFullDocument) {
    return mapDirectDebitFromMineForm(normalizePortalPaymentForm(mandateOrForm));
  }

  return mapDirectDebitFromMineForm({
    directDebitMandate: mandateOrForm,
    ...mandateOrForm,
  });
};

export const extractPaymentFormPrefill = response => {
  const body = response?.data;
  if (!body || typeof body !== 'object') return null;
  const form = body.data?.paymentForm ?? body.paymentForm ?? null;
  return form ? normalizePortalPaymentForm(form) : null;
};

export const extractPortalPaymentForm = response => {
  const body = response?.data;
  if (!body || typeof body !== 'object') return null;

  if (body._id || body.id || body.formType) {
    return normalizePortalPaymentForm(body);
  }

  const nested = body.data;
  if (nested && typeof nested === 'object' && (nested._id || nested.id || nested.formType)) {
    return normalizePortalPaymentForm(nested);
  }

  return null;
};

export const mergePaymentFormWithPrefill = (existing, prefill) => {
  if (!existing) return prefill ? normalizePortalPaymentForm(prefill) : null;
  if (!prefill) return normalizePortalPaymentForm(existing);

  const normalizedExisting = normalizePortalPaymentForm(existing);
  const normalizedPrefill = normalizePortalPaymentForm(prefill);

  const existingMandate = extractDirectDebitMandateFields(normalizedExisting);
  const prefillMandate = extractDirectDebitMandateFields(normalizedPrefill);

  return {
    ...normalizedExisting,
    membershipNumber: pickNonEmpty(
      normalizedExisting.membershipNumber,
      normalizedPrefill.membershipNumber,
    ),
    organisationSnapshot:
      normalizedExisting.organisationSnapshot ||
      normalizedPrefill.organisationSnapshot,
    directDebitMandate: {
      ...existingMandate,
      creditorName: pickNonEmpty(
        existingMandate.creditorName,
        prefillMandate.creditorName,
      ),
      creditorIdentifier: pickNonEmpty(
        existingMandate.creditorIdentifier,
        prefillMandate.creditorIdentifier,
      ),
      creditorAddress: pickNonEmpty(
        existingMandate.creditorAddress,
        prefillMandate.creditorAddress,
      ),
      creditorCity: pickNonEmpty(
        existingMandate.creditorCity,
        prefillMandate.creditorCity,
      ),
      creditorPostcode: pickNonEmpty(
        existingMandate.creditorPostcode,
        prefillMandate.creditorPostcode,
      ),
      creditorCountry: pickNonEmpty(
        existingMandate.creditorCountry,
        prefillMandate.creditorCountry,
      ),
      uniqueMandateReference: pickNonEmpty(
        existingMandate.uniqueMandateReference,
        prefillMandate.uniqueMandateReference,
      ),
      debtorName: pickNonEmpty(
        existingMandate.debtorName,
        prefillMandate.debtorName,
      ),
      debtorAddress: pickNonEmpty(
        existingMandate.debtorAddress,
        prefillMandate.debtorAddress,
      ),
      debtorCity: pickNonEmpty(
        existingMandate.debtorCity,
        prefillMandate.debtorCity,
      ),
      debtorPostcode: pickNonEmpty(
        existingMandate.debtorPostcode,
        prefillMandate.debtorPostcode,
      ),
      debtorCountry: pickNonEmpty(
        existingMandate.debtorCountry,
        prefillMandate.debtorCountry,
      ),
      debtorIban: pickNonEmpty(
        existingMandate.debtorIban,
        prefillMandate.debtorIban,
      ),
      debtorBic: pickNonEmpty(
        existingMandate.debtorBic,
        prefillMandate.debtorBic,
      ),
      signedDate: pickNonEmpty(
        existingMandate.signedDate,
        prefillMandate.signedDate,
      ),
      paymentTypeRecurrent:
        existingMandate.paymentTypeRecurrent ??
        prefillMandate.paymentTypeRecurrent,
      isAuthorized:
        existingMandate.isAuthorized ?? prefillMandate.isAuthorized,
    },
  };
};

const formatOrganisationBankAddress = bankAddress => {
  if (!bankAddress || typeof bankAddress !== 'object') return '';
  const line1 = [bankAddress.buildingOrHouse, bankAddress.streetOrRoad]
    .filter(Boolean)
    .join(', ');
  const line2 = [
    bankAddress.areaOrTown,
    bankAddress.countyCityOrPostCode,
    bankAddress.country,
  ]
    .filter(Boolean)
    .join(', ');
  return [line1, line2].filter(Boolean).join('\n');
};

export const mapCreditorOrganizationDetails = paymentForm => {
  if (!paymentForm) return null;

  const mandate = paymentForm.directDebitMandate;
  const org = paymentForm.organisationSnapshot;

  if (
    !mandate &&
    (paymentForm.creditorName ||
      paymentForm.creditorIban ||
      paymentForm.creditorIdentifier)
  ) {
    return {
      name: paymentForm.creditorName || '',
      identifier: paymentForm.creditorIdentifier || '',
      address: paymentForm.creditorAddress || '',
      city: paymentForm.creditorCity || '',
      postCode: paymentForm.creditorPostcode || '',
      country: paymentForm.creditorCountry || '',
    };
  }

  if (mandate) {
    const bankAddress = formatOrganisationBankAddress(org?.bankAddress);
    return {
      name:
        mandate.creditorName ||
        org?.legalName ||
        org?.tradingName ||
        org?.bankName ||
        '',
      identifier:
        mandate.creditorIdentifier ||
        org?.sepaOriginatorIdentificationNumber ||
        '',
      address: mandate.creditorAddress || bankAddress || '',
      city: mandate.creditorCity || org?.bankAddress?.areaOrTown || '',
      postCode:
        mandate.creditorPostcode ||
        org?.bankAddress?.countyCityOrPostCode ||
        '',
      country: mandate.creditorCountry || org?.bankAddress?.country || '',
    };
  }

  if (!org) return null;

  return {
    name: org.legalName || org.tradingName || org.bankName || '',
    identifier: org.sepaOriginatorIdentificationNumber || '',
    address: formatOrganisationBankAddress(org.bankAddress),
    city: org.bankAddress?.areaOrTown || '',
    postCode: org.bankAddress?.countyCityOrPostCode || '',
    country: org.bankAddress?.country || '',
  };
};

export const getUniqueMandateReferenceFromForm = paymentForm => {
  if (!paymentForm) return '';
  return (
    paymentForm.directDebitMandate?.uniqueMandateReference ||
    paymentForm.membershipNumber ||
    ''
  );
};

export const hasCreditorOrganizationDetails = paymentForm => {
  const details = mapCreditorOrganizationDetails(paymentForm);
  return Boolean(details?.name?.trim());
};

export const getOrganizationNameFromPrefill = paymentForm => {
  if (!paymentForm) return '';

  const creditor = mapCreditorOrganizationDetails(paymentForm);
  if (creditor?.name?.trim()) return creditor.name.trim();

  const standingOrder = paymentForm.standingOrder || {};
  const org = paymentForm.organisationSnapshot || {};

  return (
    standingOrder.beneficiaryAccountName ||
    standingOrder.creditorName ||
    org.legalName ||
    org.tradingName ||
    org.bankName ||
    ''
  );
};
