// src/utils/ageCalculation.ts

/**
 * Calculates age in years at a specific date
 */
export function calculateAgeAtDate(birthDate: string, atDate: string): number {
  const birth = new Date(birthDate);
  const target = new Date(atDate);
  
  let age = target.getFullYear() - birth.getFullYear();
  const monthDiff = target.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Calculates current age in years
 */
export function calculateCurrentAge(birthDate: string): number {
  return calculateAgeAtDate(birthDate, new Date().toISOString());
}

/**
 * Formats age display with additional context
 */
export function formatAgeDisplay(currentAge: number, mpStartAge?: number): string {
  if (mpStartAge !== undefined && mpStartAge !== currentAge) {
    return `${currentAge} years (${mpStartAge} at MP start)`;
  }
  return `${currentAge} years`;
}