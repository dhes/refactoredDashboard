// src/utils/evaluationPeriods.ts
import type { MeasurementPeriod } from '../contexts/MeasurementPeriodContext';

/**
 * Gets the start and end dates to send to Library/$evaluate calls.
 * 
 * This function ensures consistent behavior across all hooks:
 * - Real Time mode: Sends 1900 dates (1900-01-01 to 1900-12-31) 
 *   which triggers CQL Real Time Mode detection in the server
 * - Retrospective mode: Sends actual measurement period dates (2025, 2026, etc.)
 * 
 * @param measurementPeriod The measurement period from context
 * @returns Object with start and end date strings for the API call
 */
export function getLibraryEvaluationPeriod(measurementPeriod: MeasurementPeriod) {
  return {
    start: measurementPeriod.start,
    end: measurementPeriod.end
  };
}