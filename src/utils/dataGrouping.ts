// src/utils/dataGrouping.ts
import type { Procedure, Observation } from '../types/fhir';

/**
 * Groups procedures by their performance date
 */
export const groupProceduresByDate = (procedures: Procedure[]): Record<string, Procedure[]> => {
  const grouped: Record<string, Procedure[]> = {};

  procedures.forEach((proc) => {
    const date =
      proc.performedDateTime?.slice(0, 10) ||
      proc.performedPeriod?.start?.slice(0, 10) ||
      "Unknown Date";

    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(proc);
  });

  return grouped;
};

/**
 * Groups observations by their effective date
 */
export const groupObservationsByDate = (observations: Observation[]): Record<string, Observation[]> => {
  const grouped: Record<string, Observation[]> = {};

  observations.forEach((obs) => {
    const date =
      obs.effectiveDateTime?.slice(0, 10) ||
      obs.effectivePeriod?.start?.slice(0, 10) ||
      "Unknown Date";

    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(obs);
  });

  return grouped;
};

/**
 * Generic function to group any array of items by a date extracted from each item
 */
export const groupByDate = <T>(
  items: T[],
  getDate: (item: T) => string | undefined
): Record<string, T[]> => {
  const grouped: Record<string, T[]> = {};

  items.forEach((item) => {
    const date = getDate(item)?.slice(0, 10) || "Unknown Date";

    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(item);
  });

  return grouped;
};