/**
 * Formats a Date object to "HH:MM AM/PM" string
 * @param {Date|null} date
 * @returns {string}
 */
export const formatTime = (date) => {
  if (!date) return '';
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Parses "HH:MM AM/PM" string to Date object
 * @param {string} str
 * @returns {Date|null}
 */
export const parseTime = (str) => {
  if (!str) return null;
  const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};
