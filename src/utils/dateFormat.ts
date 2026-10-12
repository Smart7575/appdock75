import { DateFormatOption } from '../types';
import { useAuth } from '../context/AuthContext';

export const DEFAULT_DATE_FORMAT: DateFormatOption = 'DD/MM/YYYY';

export interface DateFormatConfig {
  id: DateFormatOption;
  label: string;
  example: string;
  description: string;
}

export const DATE_FORMAT_OPTIONS: DateFormatConfig[] = [
  {
    id: 'DD/MM/YYYY',
    label: 'DD/MM/YYYY',
    example: '12/10/2026',
    description: 'European standard (day/month/year)',
  },
  {
    id: 'YYYY-MM-DD',
    label: 'YYYY-MM-DD',
    example: '2026-10-12',
    description: 'ISO 8601 standard (year-month-day)',
  },
  {
    id: 'MM/DD/YYYY',
    label: 'MM/DD/YYYY',
    example: '10/12/2026',
    description: 'US standard (month/day/year)',
  },
  {
    id: 'DD-MM-YYYY',
    label: 'DD-MM-YYYY',
    example: '12-10-2026',
    description: 'Dutch / European hyphen (day-month-year)',
  },
  {
    id: 'DD.MM.YYYY',
    label: 'DD.MM.YYYY',
    example: '12.10.2026',
    description: 'European dot separator (day.month.year)',
  },
  {
    id: 'D MMM YYYY',
    label: 'D MMM YYYY',
    example: '12 Oct 2026',
    description: 'Short month name (day month year)',
  },
  {
    id: 'MMMM D, YYYY',
    label: 'MMMM D, YYYY',
    example: 'October 12, 2026',
    description: 'Full text (month day, year)',
  },
];

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Robust date parts extractor that supports YYYY-MM-DD, DD/MM/YYYY, ISO strings, timestamps, and Date objects.
 * Prevents UTC timezone shift on plain date strings.
 */
export function parseDateParts(input: string | number | Date | null | undefined): { year: number; month: number; day: number } | null {
  if (!input) return null;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Pattern YYYY-MM-DD (e.g., 2026-10-12 or 2026-10-12T...)
    const ymdMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
    if (ymdMatch) {
      return {
        year: parseInt(ymdMatch[1], 10),
        month: parseInt(ymdMatch[2], 10),
        day: parseInt(ymdMatch[3], 10),
      };
    }

    // Pattern DD/MM/YYYY
    const dmySlashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(trimmed);
    if (dmySlashMatch) {
      return {
        day: parseInt(dmySlashMatch[1], 10),
        month: parseInt(dmySlashMatch[2], 10),
        year: parseInt(dmySlashMatch[3], 10),
      };
    }

    // Pattern DD-MM-YYYY
    const dmyDashMatch = /^(\d{1,2})-(\d{1,2})-(\d{4})/.exec(trimmed);
    if (dmyDashMatch) {
      return {
        day: parseInt(dmyDashMatch[1], 10),
        month: parseInt(dmyDashMatch[2], 10),
        year: parseInt(dmyDashMatch[3], 10),
      };
    }

    // Pattern DD.MM.YYYY
    const dmyDotMatch = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(trimmed);
    if (dmyDotMatch) {
      return {
        day: parseInt(dmyDotMatch[1], 10),
        month: parseInt(dmyDotMatch[2], 10),
        year: parseInt(dmyDotMatch[3], 10),
      };
    }
  }

  const d = new Date(input);
  if (isNaN(d.getTime())) return null;

  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

/**
 * Formats a date into the desired DateFormatOption format.
 */
export function formatDate(
  input: string | number | Date | null | undefined,
  format: DateFormatOption = DEFAULT_DATE_FORMAT
): string {
  if (!input) return '';

  const parts = parseDateParts(input);
  if (!parts) return typeof input === 'string' ? input : '';

  const { year, month, day } = parts;
  const pad2 = (n: number) => n.toString().padStart(2, '0');

  const DD = pad2(day);
  const MM = pad2(month);
  const YYYY = year.toString();
  const D = day.toString();
  const MMM = MONTH_NAMES_SHORT[month - 1] || MM;
  const MMMM = MONTH_NAMES_FULL[month - 1] || MM;

  switch (format) {
    case 'DD/MM/YYYY':
      return `${DD}/${MM}/${YYYY}`;
    case 'YYYY-MM-DD':
      return `${YYYY}-${MM}-${DD}`;
    case 'MM/DD/YYYY':
      return `${MM}/${DD}/${YYYY}`;
    case 'DD-MM-YYYY':
      return `${DD}-${MM}-${YYYY}`;
    case 'DD.MM.YYYY':
      return `${DD}.${MM}.${YYYY}`;
    case 'D MMM YYYY':
      return `${D} ${MMM} ${YYYY}`;
    case 'MMMM D, YYYY':
      return `${MMMM} ${D}, ${YYYY}`;
    default:
      return `${DD}/${MM}/${YYYY}`;
  }
}

/**
 * React hook that automatically supplies the user's active date format preference from settings.
 */
export function useFormatDate() {
  const { user } = useAuth();
  const format: DateFormatOption = user?.settings?.dateFormat || DEFAULT_DATE_FORMAT;

  return {
    formatDate: (input: string | number | Date | null | undefined, overrideFormat?: DateFormatOption) =>
      formatDate(input, overrideFormat || format),
    dateFormat: format,
  };
}
