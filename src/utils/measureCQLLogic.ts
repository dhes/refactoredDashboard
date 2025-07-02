// src/utils/measureCQLLogic.ts

import type { Patient, MeasureReport, Observation } from '../types/fhir';

/**
 * This file contains TypeScript implementations of CQL logic from CMS measures.
 * Each function is annotated with the CQL it replicates for maintenance.
 * 
 * Measure: CMS138 - Preventive Care and Screening: Tobacco Use
 * Version: 2025 (update as needed)
 */

// ============================================================================
// POPULATION HELPERS
// ============================================================================

/**
 * Extract population count from a measure group
 * Replicates checking population values in CQL
 */
export function getPopulationValue(group: any, populationType: string): boolean {
  const population = group?.population?.find((pop: any) => 
    pop.code?.coding?.[0]?.code === populationType
  );
  return (population?.count ?? 0) > 0;
}

/**
 * Extract detail population count (for custom populations we add)
 */
export function getDetailPopulationValue(group: any, detailCode: string): boolean {
  const population = group?.population?.find((pop: any) => 
    pop.code?.coding?.[0]?.system === 'http://example.org/measure-population-detail' &&
    pop.code?.coding?.[0]?.code === detailCode
  );
  return (population?.count ?? 0) > 0;
}

// ============================================================================
// CMS138 SPECIFIC LOGIC
// ============================================================================

/**
 * CQL: AgeInYearsAt(date from start of "Measurement Period") >= 12
 * From: CMS138 Initial Population criteria
 */
export function isPatientAgeEligibleForTobaccoScreening(
  patient: Patient, 
  measurePeriodStart: string
): boolean {
  if (!patient.birthDate) return false;
  
  const birthDate = new Date(patient.birthDate);
  const periodStart = new Date(measurePeriodStart);
  const ageAtPeriodStart = (periodStart.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  
  return ageAtPeriodStart >= 12;
}

/**
 * Determine if a smoking observation indicates current tobacco use
 * CQL: Various smoking status value sets
 */
export function isCurrentTobaccoUser(observation: Observation | null): boolean {
  if (!observation) return false;
  
  const currentSmokerCodes = [
    '449868002',     // Current every day smoker
    '428041000124106', // Current some day smoker  
    '77176002'       // Smoker, current status unknown
  ];
  
  return observation.valueCodeableConcept?.coding?.some(
    coding => currentSmokerCodes.includes(coding.code || '')
  ) ?? false;
}

/**
 * Check if smoking status observation is recent (within 1 year)
 */
export function isSmokingStatusCurrent(
  observation: Observation | null,
  referenceDate: Date = new Date()
): boolean {
  if (!observation?.effectiveDateTime) return false;
  
  const observationDate = new Date(observation.effectiveDateTime);
  const oneYearAgo = new Date(referenceDate);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  return observationDate >= oneYearAgo;
}

// ============================================================================
// MEASURE GUIDANCE GENERATORS
// ============================================================================

/**
 * Generate practitioner-friendly guidance based on CMS138 measure results
 */
export function getCMS138Guidance(
  measureReport: MeasureReport,
  patient: Patient
): { message: string; action?: string; priority: 'info' | 'warning' | 'action' } {
  const group1 = measureReport.group?.[0];
  const group2 = measureReport.group?.[1];
  
  // Check if patient is in initial population
  const inDenominator1 = getPopulationValue(group1, 'denominator');
  
  if (!inDenominator1) {
    // Not in initial population - determine why
    const periodStart = measureReport.period?.start || '';
    const isAgeEligible = isPatientAgeEligibleForTobaccoScreening(patient, periodStart);
    
    if (!isAgeEligible) {
      return {
        message: "Patient is under 12 years old",
        priority: 'info'
      };
    }
    
    // Must be missing encounters
    return {
      message: "Patient has no qualifying encounters in measurement period",
      action: "Create a qualifying encounter",
      priority: 'action'
    };
  }
  
  // Check if tobacco history was documented
  const hasHistory = getPopulationValue(group1, 'numerator');
  
  if (!hasHistory) {
    return {
      message: "Tobacco use screening not documented in measurement period",
      action: "Document tobacco use status",
      priority: 'action'
    };
  }
  
  // Check if intervention is needed (Group 2)
  const needsIntervention = getPopulationValue(group2, 'denominator');
  
  if (needsIntervention) {
    const hasIntervention = getPopulationValue(group2, 'numerator');
    if (!hasIntervention) {
      return {
        message: "Patient is a current tobacco user without documented cessation intervention",
        action: "Provide cessation counseling or pharmacotherapy",
        priority: 'action'
      };
    }
  }
  
  return {
    message: "All tobacco screening and intervention requirements met",
    priority: 'info'
  };
}

// ============================================================================
// DISPLAY FORMATTERS
// ============================================================================

/**
 * Format population results for practitioner display
 */
export function formatCMS138GroupForPractitioner(
  group: any,
  groupNumber: number
): { title: string; items: Array<{ label: string; value: string; status: 'met' | 'not-met' | 'excluded' }> } {
  if (groupNumber === 1) {
    return {
      title: "Tobacco History Documentation",
      items: [
        {
          label: "Should have tobacco history",
          value: getPopulationValue(group, 'denominator') ? 'Yes' : 'No',
          status: getPopulationValue(group, 'denominator') ? 'met' : 'not-met'
        },
        {
          label: "Excluded from requirement",
          value: getPopulationValue(group, 'denominator-exclusion') ? 'Yes' : 'No',
          status: getPopulationValue(group, 'denominator-exclusion') ? 'excluded' : 'met'
        },
        {
          label: "Has current tobacco history",
          value: getPopulationValue(group, 'numerator') ? 'Yes' : 'No',
          status: getPopulationValue(group, 'numerator') ? 'met' : 'not-met'
        }
      ]
    };
  } else if (groupNumber === 2) {
    return {
      title: "Tobacco Cessation Intervention",
      items: [
        {
          label: "Needs cessation intervention",
          value: getPopulationValue(group, 'denominator') ? 'Yes' : 'No',
          status: 'met'
        },
        {
          label: "Excluded from intervention",
          value: getPopulationValue(group, 'denominator-exclusion') ? 'Yes' : 'No',
          status: getPopulationValue(group, 'denominator-exclusion') ? 'excluded' : 'met'
        },
        {
          label: "Received intervention",
          value: getPopulationValue(group, 'numerator') ? 'Yes' : 'No',
          status: getPopulationValue(group, 'numerator') ? 'met' : 'not-met'
        }
      ]
    };
  }
  
  return { title: `Group ${groupNumber}`, items: [] };
}