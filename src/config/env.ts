/**
 * Returns the API URL prefix built from API_BASE_URL, ENV and API_VERSION
 */
export const getApiPrefix = (): string =>
  `/${process.env.API_BASE_URL ?? 'backend'}/${process.env.ENV ?? 'dev'}/${process.env.API_VERSION ?? 'v1'}`;

/**
 * Returns the port the server listens on
 */
export const getPort = (): number => Number(process.env.PORT ?? 3000);

/**
 * Returns the browser origins allowed to read responses
 */
export const getAllowedOrigins = (): string[] =>
  (process.env.ALLOWED_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
