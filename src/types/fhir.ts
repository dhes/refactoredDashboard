// src/types/fhir.ts
// Import FHIR R4 types from the installed package
import type {
  Patient,
  Encounter,
  Observation,
  MeasureReport,
  Bundle,
  CodeableConcept,
  Coding,
  Period,
  Reference,
  AllergyIntolerance,
  Condition,
  MedicationStatement,
  FamilyMemberHistory,
  Immunization,
  Procedure,
} from 'fhir/r4';

// Re-export the types for use in your app
export type {
  Patient,
  Encounter,
  Observation,
  MeasureReport,
  Bundle,
  CodeableConcept,
  Coding,
  Period,
  Reference,
  AllergyIntolerance,
  Condition,
  MedicationStatement,
  FamilyMemberHistory,
  Immunization,
  Procedure,
};

// Common encounter type codes for CMS measures
export const ENCOUNTER_TYPE_CODES = {
  OFFICE_VISIT: {
    system: 'http://www.ama-assn.org/go/cpt',
    code: '99213',
    display: 'Office or other outpatient visit'
  },
  PREVENTIVE_CARE: {
    system: 'http://www.ama-assn.org/go/cpt',
    code: '99385',
    display: 'Initial preventive physical examination'
  },
  WELLNESS_VISIT: {
    system: 'http://www.ama-assn.org/go/cpt',
    code: 'G0438',
    display: 'Annual wellness visit'
  }
} as const;

// Helper function to create a minimal encounter for CMS measures
export function createMinimalEncounter(
  patientId: string,
  date: string = new Date().toISOString()
): Encounter {
  return {
    resourceType: 'Encounter',
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    type: [{
      coding: [ENCOUNTER_TYPE_CODES.OFFICE_VISIT]
    }],
    subject: {
      reference: `Patient/${patientId}`
    },
    period: {
      start: date,
      end: date
    }
  };
}

// These should be in src/types/fhir.ts BEFORE the createSmokingStatusObservation function

// Smoking status observation codes
export const SMOKING_STATUS_CODES = {
  TOBACCO_USE: {
    system: 'http://loinc.org',
    code: '72166-2',
    display: 'Tobacco smoking status'
  }
} as const;

// Common smoking status values
export const SMOKING_STATUS_VALUES = {
  NEVER_SMOKER: {
    system: 'http://snomed.info/sct',
    code: '266919005',
    display: 'Never smoker'
  },
  FORMER_SMOKER: {
    system: 'http://snomed.info/sct',
    code: '8517006',
    display: 'Former smoker'
  },
  CURRENT_SMOKER: {
    system: 'http://snomed.info/sct',
    code: '77176002',
    display: 'Current smoker'
  },
  UNKNOWN: {
    system: 'http://snomed.info/sct',
    code: '266927001',
    display: 'Tobacco use unknown'
  }
} as const;

// Helper function to create a smoking status observation
export function createSmokingStatusObservation(
  patientId: string,
  status: keyof typeof SMOKING_STATUS_VALUES,
  encounterId?: string,
  date: string = new Date().toISOString()
): Observation {
  const observation: Observation = {
    resourceType: 'Observation',
    status: 'final',
    code: {
      coding: [SMOKING_STATUS_CODES.TOBACCO_USE]
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    effectiveDateTime: date,
    valueCodeableConcept: {
      coding: [SMOKING_STATUS_VALUES[status]]
    }
  };

  if (encounterId) {
    observation.encounter = {
      reference: `Encounter/${encounterId}`
    };
  }

  return observation;
}

// Helper type for FHIR operation outcomes
export interface OperationOutcome {
  resourceType: 'OperationOutcome';
  issue: Array<{
    severity: 'fatal' | 'error' | 'warning' | 'information';
    code: string;
    diagnostics?: string;
  }>;
}