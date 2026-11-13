import type { TErrorSummary, TLevel } from './types/logger.js';

const write = (level: TLevel, message: string, detail?: unknown): void => {
  const detailText = detail instanceof Error ? (detail.stack ?? detail.message) : detail;
  process.stdout.write(`${JSON.stringify({ time: new Date().toISOString(), level, message, detail: detailText })}\n`);
};

/**
 * Writes one JSON line per event to stdout
 */
export const logger = {
  info: (message: string, detail?: unknown): void => write('info', message, detail),
  warn: (message: string, detail?: unknown): void => write('warn', message, detail),
  error: (message: string, detail?: unknown): void => write('error', message, detail)
};

/**
 * Reduces an error to its name and driver code, so logs never carry the message or the values it may include
 */
export const summarizeError = (error: unknown): TErrorSummary => {
  if (!(error instanceof Error)) {
    return { name: typeof error };
  }
  const source = 'driverError' in error && typeof error.driverError === 'object' && error.driverError !== null
    ? error.driverError
    : error;
  const code = [Reflect.get(source, 'number'), Reflect.get(source, 'code')]
    .find((value) => typeof value === 'string' || typeof value === 'number');
  return { name: error.name, code };
};
