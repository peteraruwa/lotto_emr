import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Formats an ISO date string to a human-readable date (e.g. "15 Jan 2024").
 */
export function formatDate(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  const date = parseISO(isoString);
  if (!isValid(date)) return '—';
  return format(date, 'd MMM yyyy');
}

/**
 * Formats an ISO datetime string to a human-readable date and time (e.g. "15 Jan 2024, 14:30").
 */
export function formatDateTime(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  const date = parseISO(isoString);
  if (!isValid(date)) return '—';
  return format(date, 'd MMM yyyy, HH:mm');
}

/**
 * Returns a relative time string (e.g. "3 hours ago") for an ISO datetime string.
 */
export function formatRelativeTime(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  const date = parseISO(isoString);
  if (!isValid(date)) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Formats a Nigerian phone number to a consistent display format.
 * Accepts various input formats (with/without country code, spaces, dashes).
 * Output: +234 801 234 5678
 */
export function formatNigerianPhone(phone: string | undefined | null): string {
  if (!phone) return '—';

  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle country code prefix
  let local = digits;
  if (digits.startsWith('234') && digits.length >= 13) {
    local = '0' + digits.slice(3);
  } else if (digits.startsWith('0') && digits.length === 11) {
    local = digits;
  } else {
    // Return as-is if we can't parse it
    return phone;
  }

  // Format: 0801 234 5678
  const formatted = `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  return `+234 ${formatted.slice(1)}`;
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates a string to a maximum length, adding an ellipsis if needed.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}
