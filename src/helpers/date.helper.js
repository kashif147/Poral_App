import moment from 'moment';

export const isDataFormat = (dateStr) => {
  // Check if dateStr is already in ISO 8601 format
  if (moment(dateStr, moment.ISO_8601, true).isValid()) {
    return dateStr; // Already in correct format
  }

  // Otherwise, try parsing as DD/MM/YYYY
  const parsed = moment(dateStr, 'DD/MM/YYYY', true);
  if (parsed.isValid()) {
    return parsed.toISOString(); // Convert to ISO 8601 format
  }

  // Invalid date
  return null;
}

export const formatToDDMMYYYY = (dateString) => {
  const date = moment(dateString, moment.ISO_8601, true);
  return date.isValid() ? date.format('DD/MM/YYYY') : null;
}