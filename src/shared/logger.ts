type TLevel = 'info' | 'warn' | 'error';

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
