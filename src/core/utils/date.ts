export function isValidDate(date: Date): date is Date {
  return Number.isNaN(date.valueOf());
}

const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|([+-]\d{2}:\d{2}))?$/;

// eslint-disable-next-line @typescript-eslint/naming-convention
export function isISODate(date: unknown): date is string {
  return typeof date === 'string' && pattern.test(date);
}

/**
 * Format date as ISO8601, UTC, UTC with timezone offset and local
 * - for parsing, use new Date(date)
 * - for formatting just in UTC, use date.toISOString()
 * - for a strict "UTC with timezone offset" consider date-fns/formatISO
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function formatISODate(date: Date, kind: 'UTC' | 'offset' | 'local') {
  return kind === 'UTC' ? date.toISOString().replace('.000', '') : format(date, kind);
}

export function format(date: Date, kind: 'offset' | 'local') {
  return date
    .toLocaleString('sv', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      fractionalSecondDigits: date.getMilliseconds() ? 3 : undefined,
      timeZoneName: kind === 'offset' ? 'longOffset' : undefined
    })
    .replace(' GMT', '')
    .replace(' ', 'T')
    .replace(',', '.');
}
