export type TResponse = { message: string; error: boolean; code: number; data: unknown };

/**
 * Builds a successful response in the standard envelope
 */
export const success = (message: string, code: number, data: unknown): TResponse => ({
  message,
  error: false,
  code,
  data
});

/**
 * Builds an error response in the standard envelope
 */
export const failure = (message: string, code: number, data: unknown = null): TResponse => ({
  message,
  error: true,
  code,
  data
});
