export const REJECTED_APPLICATION_REAPPLY_MESSAGE =
  'Your previous application was not approved and the payment authorisation was cancelled. If you wish to apply again, please submit a new application and authorise a new payment.';

export const APPLICATION_PAYMENT_AUTHORISED_MESSAGE =
  'Your payment has been authorised successfully. Your application is now pending review. The payment will only be completed if your application is approved.';

export const normalizePaymentIntentStatus = status =>
  String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

export const getPaymentIntentMemberLabel = status => {
  const normalized = normalizePaymentIntentStatus(status);

  const labels = {
    requires_capture: 'Payment authorised',
    succeeded: 'Payment completed',
    canceled: 'Payment cancelled',
    cancelled: 'Payment cancelled',
    payment_failed: 'Payment failed',
    requires_action: 'Authentication required',
    authorisation_expired: 'Payment authorisation expired',
    requires_payment_method: 'Payment failed',
    processing: 'Payment processing',
  };

  return labels[normalized] || 'Payment status unknown';
};

export const getPaymentIntentMemberMessage = (
  status,
  { isApplicationPayment = false } = {},
) => {
  const normalized = normalizePaymentIntentStatus(status);

  if (isApplicationPayment) {
    switch (normalized) {
      case 'requires_capture':
        return APPLICATION_PAYMENT_AUTHORISED_MESSAGE;
      case 'succeeded':
        return 'Payment completed. Your application has been approved and processed.';
      case 'canceled':
      case 'cancelled':
        return 'Payment authorisation was cancelled or expired.';
      case 'requires_payment_method':
      case 'payment_failed':
        return 'Payment failed. Please try again.';
      case 'requires_action':
        return 'Additional card authentication is required. Please complete authentication to continue.';
      case 'processing':
        return 'Payment is being processed. Please check back later.';
      case 'authorisation_expired':
        return 'Payment authorisation expired. Please submit a new application and authorise a new payment.';
      default:
        return 'Unable to confirm payment status. Please try again or contact support.';
    }
  }

  switch (normalized) {
    case 'requires_capture':
      return 'Your payment has been authorised successfully.';
    case 'succeeded':
      return 'Your payment has been completed successfully.';
    case 'canceled':
    case 'cancelled':
      return 'Payment authorisation was cancelled or expired.';
    case 'requires_payment_method':
    case 'payment_failed':
      return 'Payment failed. Please try again.';
    case 'requires_action':
      return 'Additional card authentication is required.';
    case 'processing':
      return 'Payment is being processed. Please check back later.';
    case 'authorisation_expired':
      return 'Payment authorisation expired. Please try again.';
    default:
      return 'Unable to confirm payment status. Please try again.';
  }
};

export const isPaymentIntentAuthorised = status => {
  const normalized = normalizePaymentIntentStatus(status);
  return normalized === 'requires_capture' || normalized === 'succeeded';
};

export const resolvePaymentIntentOutcome = (
  status,
  { isApplicationPayment = false } = {},
) => {
  const normalized = normalizePaymentIntentStatus(status);

  if (isPaymentIntentAuthorised(normalized)) {
    const isAuthorisedOnly = normalized === 'requires_capture';

    return {
      success: true,
      outcome: isAuthorisedOnly ? 'authorised' : 'completed',
      title:
        isApplicationPayment && isAuthorisedOnly
          ? 'Payment authorised'
          : isApplicationPayment
            ? 'Payment completed'
            : 'Payment successful',
      message: getPaymentIntentMemberMessage(normalized, { isApplicationPayment }),
      label: getPaymentIntentMemberLabel(normalized),
      paymentIntentStatus: normalized,
    };
  }

  if (normalized === 'requires_action') {
    return {
      success: false,
      outcome: 'requires_action',
      title: 'Authentication required',
      message: getPaymentIntentMemberMessage(normalized, { isApplicationPayment }),
      label: getPaymentIntentMemberLabel(normalized),
      paymentIntentStatus: normalized,
    };
  }

  if (normalized === 'processing') {
    return {
      success: false,
      outcome: 'processing',
      title: 'Payment processing',
      message: getPaymentIntentMemberMessage(normalized, { isApplicationPayment }),
      label: getPaymentIntentMemberLabel(normalized),
      paymentIntentStatus: normalized,
    };
  }

  return {
    success: false,
    outcome: 'failed',
    title: 'Payment failed',
    message: getPaymentIntentMemberMessage(normalized, { isApplicationPayment }),
    label: getPaymentIntentMemberLabel(normalized),
    paymentIntentStatus: normalized,
  };
};

export const getSettlementStatusMemberLabel = status => {
  const upper = String(status || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

  if (upper === 'SETTLED' || upper === 'PAID' || upper === 'SUCCEEDED') {
    return 'Payment completed';
  }

  if (
    upper === 'PENDING' ||
    upper === 'AUTHORISED' ||
    upper === 'AUTHORIZED' ||
    upper === 'REQUIRES_CAPTURE'
  ) {
    return 'Payment authorised';
  }

  if (upper === 'CANCELLED' || upper === 'CANCELED') {
    return 'Payment cancelled';
  }

  if (upper === 'FAILED' || upper === 'PAYMENT_FAILED') {
    return 'Payment failed';
  }

  if (upper === 'PROCESSING') {
    return 'Payment processing';
  }

  return status || 'Pending';
};
