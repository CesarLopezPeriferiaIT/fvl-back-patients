const TIME_ZONE = 'America/Bogota';

/**
 * Returns today's date as YYYY-MM-DD in the Colombian time zone, read on every call
 */
export const getToday = (): string => new Date().toLocaleDateString('en-CA', { timeZone: TIME_ZONE });

/**
 * Returns the completed years between a YYYY-MM-DD birth date and a YYYY-MM-DD reference date
 */
export const calculateAge = (birthDate: string, today: string): number => {
  const age = Number(today.slice(0, 4)) - Number(birthDate.slice(0, 4));
  return today.slice(5) < birthDate.slice(5) ? age - 1 : age;
};
