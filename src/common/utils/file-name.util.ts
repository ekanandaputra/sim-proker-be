/**
 * Current datetime formatted for file names, e.g. `20260925_083015123` (UTC, with milliseconds).
 */
export function fileTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace(/[-:.]/g, '').replace('T', '_').replace('Z', '');
}

/**
 * Sanitize a string so it is safe to use as part of a file name.
 */
export function sanitizeFileNamePart(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_');
}

/**
 * Build a storage file name (without extension) as `<prefix>_<timestamp>`.
 */
export function buildTimestampedFileName(prefix: string): string {
  return `${sanitizeFileNamePart(prefix)}_${fileTimestamp()}`;
}
