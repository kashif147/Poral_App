/**
 * Normalize a mobile number to E.164 (+<country><number>) for API storage.
 */
export const normalizeMobileToE164 = (mobileNo, defaultCountry = 'IE') => {
  const raw = String(mobileNo || '').trim();
  if (!raw) {
    return '';
  }

  if (raw.startsWith('+')) {
    return raw.replace(/\s+/g, '');
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  if (digits.startsWith('00')) {
    return `+${digits.slice(2)}`;
  }

  if (digits.startsWith('353')) {
    return `+${digits}`;
  }

  if (defaultCountry === 'IE' && digits.startsWith('08')) {
    return `+353${digits.slice(1)}`;
  }

  if (defaultCountry === 'IE' && digits.startsWith('8') && digits.length >= 9) {
    return `+353${digits}`;
  }

  if (digits.startsWith('0')) {
    return digits;
  }

  return `+${digits}`;
};
