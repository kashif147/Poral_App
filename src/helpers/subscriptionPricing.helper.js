const normalizePaymentType = paymentType =>
  String(paymentType || '')
    .trim()
    .toLowerCase();

const normalizeFrequency = frequency =>
  String(frequency || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

export const isAnnualAutoPaymentType = paymentType => {
  const normalized = normalizePaymentType(paymentType);
  return (
    normalized.includes('credit card') ||
    normalized.includes('cheque') ||
    normalized.includes('cash')
  );
};

export const isStandingOrderPaymentType = paymentType => {
  const normalized = normalizePaymentType(paymentType);
  return normalized.includes('standing');
};

export const isSalaryDeductionPaymentType = paymentType => {
  const normalized = normalizePaymentType(paymentType);
  if (normalized.includes('direct') && normalized.includes('debit')) {
    return false;
  }
  return (
    (normalized.includes('salary') && normalized.includes('deduction')) ||
    normalized === 'deduction' ||
    normalized.includes('payroll') ||
    (normalized.includes('deduction') && normalized.includes('source'))
  );
};

export const isDirectDebitPaymentType = paymentType => {
  const normalized = normalizePaymentType(paymentType);
  return normalized.includes('direct') && normalized.includes('debit');
};

export const isDeductionOrDebitPaymentType = paymentType =>
  isSalaryDeductionPaymentType(paymentType) ||
  isDirectDebitPaymentType(paymentType);

export const getPaymentFrequencyCategory = paymentType => {
  if (isAnnualAutoPaymentType(paymentType)) return 'annual';
  if (isStandingOrderPaymentType(paymentType)) return 'standingOrder';
  if (isDeductionOrDebitPaymentType(paymentType)) return 'deductionDebit';
  return null;
};

export const STANDING_ORDER_FREQUENCY_OPTIONS = [
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Fortnightly', label: 'Fortnightly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Annually', label: 'Annually' },
];

export const DEDUCTION_DEBIT_FREQUENCY_OPTIONS = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Annually', label: 'Annually' },
];

export const getFrequencyOptionsForPaymentType = paymentType => {
  const category = getPaymentFrequencyCategory(paymentType);
  if (category === 'standingOrder') return STANDING_ORDER_FREQUENCY_OPTIONS;
  if (category === 'deductionDebit') return DEDUCTION_DEBIT_FREQUENCY_OPTIONS;
  return [];
};

export const getDefaultFrequencyForPaymentType = paymentType => {
  const category = getPaymentFrequencyCategory(paymentType);
  if (category === 'annual') return 'Annually';
  if (category === 'standingOrder' || category === 'deductionDebit') {
    return 'Monthly';
  }
  return '';
};

const getPricingList = categoryData => {
  if (!categoryData) return [];

  const list =
    categoryData.pricings ||
    categoryData.productPricings ||
    categoryData.pricingList ||
    [];

  if (Array.isArray(list) && list.length > 0) {
    return list;
  }

  return categoryData.currentPricing ? [categoryData.currentPricing] : [];
};

const findPricingRecord = (categoryData, frequency) => {
  const target = normalizeFrequency(frequency);
  const list = getPricingList(categoryData);

  const directMatch = list.find(item => {
    const itemFrequency = normalizeFrequency(
      item?.frequency || item?.paymentFrequency,
    );
    return itemFrequency === target;
  });

  if (directMatch?.price != null) {
    return directMatch;
  }

  if (target === 'annually' || target === 'annual') {
    const annualMatch = list.find(item => {
      const itemFrequency = normalizeFrequency(
        item?.frequency || item?.paymentFrequency,
      );
      return itemFrequency === 'annually' || itemFrequency === 'annual';
    });
    if (annualMatch?.price != null) {
      return annualMatch;
    }
  }

  return categoryData?.currentPricing || null;
};

const derivePriceFromAnnual = (annualCents, frequency, currency) => {
  const target = normalizeFrequency(frequency);

  const divisors = {
    weekly: 52,
    fortnightly: 26,
    monthly: 12,
    quarterly: 4,
    annually: 1,
    annual: 1,
  };

  const divisor = divisors[target];
  if (!divisor) return null;

  return {
    price: Math.round(annualCents / divisor),
    currency: currency || 'EUR',
    frequency,
  };
};

export const getPriceForFrequency = (categoryData, frequency = 'Annually') => {
  if (!categoryData) return null;

  const direct = findPricingRecord(categoryData, frequency);
  if (direct?.price != null) {
    return {
      price: direct.price,
      currency: direct.currency || categoryData?.currentPricing?.currency || 'EUR',
      frequency: direct.frequency || direct.paymentFrequency || frequency,
    };
  }

  const annualRecord =
    findPricingRecord(categoryData, 'Annually') ||
    findPricingRecord(categoryData, 'Annual') ||
    categoryData?.currentPricing;

  if (annualRecord?.price == null) return null;

  return derivePriceFromAnnual(
    annualRecord.price,
    frequency,
    annualRecord.currency || categoryData?.currentPricing?.currency || 'EUR',
  );
};

export const getSubscriptionFeeLabel = frequency => {
  const normalized = normalizeFrequency(frequency);
  const labels = {
    weekly: 'Weekly Fee',
    fortnightly: 'Fortnightly Fee',
    monthly: 'Monthly Fee',
    quarterly: 'Quarterly Fee',
    annually: 'Annual Fee',
    annual: 'Annual Fee',
  };
  return labels[normalized] || 'Subscription Fee';
};

export const findWorkLocationLookupItem = (
  workLocation,
  workLocationLookups = [],
) => {
  if (!workLocation || workLocation === 'other') return null;

  return (
    (workLocationLookups || []).find(item => {
      const lookup = item?.lookup || {};
      const name = lookup.DisplayName || lookup.lookupname || '';
      const id = lookup._id || lookup.id || '';
      return (
        name === workLocation || (id && String(id) === String(workLocation))
      );
    }) || null
  );
};

export const workLocationAllowsSalaryDeduction = (
  workLocation,
  workLocationLookups = [],
) => {
  const selected = findWorkLocationLookupItem(
    workLocation,
    workLocationLookups,
  );

  if (!selected?.lookup) return false;

  // Only the work-location lookup carries this flag — not branch/region/hierarchy
  return selected.lookup.processSalaryDeduction === true;
};
