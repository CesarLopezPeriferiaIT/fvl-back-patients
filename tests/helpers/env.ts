import { vi } from 'vitest';

/**
 * Fixes the variables that build the API prefix, so tests do not depend on the machine's .env
 */
export const stubApiEnv = (env = 'dev'): void => {
  vi.stubEnv('ENV', env);
  vi.stubEnv('API_BASE_URL', 'backend');
  vi.stubEnv('API_VERSION', 'v1');
};
