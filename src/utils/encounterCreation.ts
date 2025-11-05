// src/utils/encounterCreation.ts
import { fhirClient } from '../services/fhirClient';

export interface EncounterFormData {
  encounterDate: string;
  encounterTime?: string;  // Optional time, defaults to current
  encounterType: string;   // Key from ENCOUNTER_TYPES
  reasonCode: string;      // ICD-10 code
}

export interface EncounterType {
  cpt: string;
  display: string;
  category: 'office' | 'preventive';
  reasonCodes: Array<{
    code: string;
    display: string;
  }>;
}

/**
 * Predefined encounter types with qualifying CPT codes and appropriate ICD-10 reason codes
 * These are designed to qualify for CMS69 BMI screening measure
 */
export const ENCOUNTER_TYPES: Record<string, EncounterType> = {
  'office-visit-99213': {
    cpt: '99213',
    display: 'Office Visit - Established Patient, Level 3',
    category: 'office',
    reasonCodes: [
      { code: 'J00', display: 'Acute nasopharyngitis (common cold)' },
      { code: 'M79.1', display: 'Myalgia' }
    ]
  },
  'office-visit-99214': {
    cpt: '99214',
    display: 'Office Visit - Established Patient, Level 4',
    category: 'office',
    reasonCodes: [
      { code: 'J00', display: 'Acute nasopharyngitis (common cold)' },
      { code: 'M79.1', display: 'Myalgia' }
    ]
  },
  'preventive-18-39': {
    cpt: '99395',
    display: 'Preventive Care - Established Patient, 18-39 years',
    category: 'preventive',
    reasonCodes: [
      { code: 'Z00.00', display: 'Encounter for general adult medical examination without abnormal findings' },
      { code: 'Z71.9', display: 'Counseling, unspecified' }
    ]
  },
  'preventive-40-64': {
    cpt: '99396',
    display: 'Preventive Care - Established Patient, 40-64 years',
    category: 'preventive',
    reasonCodes: [
      { code: 'Z00.00', display: 'Encounter for general adult medical examination without abnormal findings' },
      { code: 'Z71.9', display: 'Counseling, unspecified' }
    ]
  },
  'preventive-65-plus': {
    cpt: '99397',
    display: 'Preventive Care - Established Patient, 65+ years',
    category: 'preventive',
    reasonCodes: [
      { code: 'Z00.00', display: 'Encounter for general adult medical examination without abnormal findings' },
      { code: 'Z71.9', display: 'Counseling, unspecified' }
    ]
  }
};

/**
 * Helper to get reason codes for a specific encounter type
 */
export const getReasonCodesForEncounter = (encounterTypeKey: string) => {
  return ENCOUNTER_TYPES[encounterTypeKey]?.reasonCodes || [];
};

/**
 * Helper to get encounter type display name
 */
export const getEncounterTypeDisplay = (encounterTypeKey: string) => {
  return ENCOUNTER_TYPES[encounterTypeKey]?.display || 'Unknown';
};

/**
 * Creates a new FHIR Encounter resource with the provided form data
 * Enhanced to support CMS69 BMI screening measure with appropriate CPT and ICD-10 codes
 */
export const createEncounter = async (
  patientId: string,
  formData: EncounterFormData
): Promise<any> => {
  const encounterType = ENCOUNTER_TYPES[formData.encounterType];

  if (!encounterType) {
    throw new Error(`Invalid encounter type: ${formData.encounterType}`);
  }

  // Parse time or use default
  const timeString = formData.encounterTime || '08:00';
  const [hours, minutes] = timeString.split(':');

  const encounter = {
    resourceType: "Encounter" as const,
    meta: {
      profile: ["http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter"],
    },
    status: "finished" as const,
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "AMB",
      display: "ambulatory",
    },
    type: [
      {
        coding: [
          {
            system: "http://www.ama-assn.org/go/cpt",
            code: encounterType.cpt,
            display: encounterType.display,
            userSelected: true
          },
        ],
      },
    ],
    subject: {
      reference: `Patient/${patientId}`,
    },
    period: {
      start: `${formData.encounterDate}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00.000Z`,
      end: `${formData.encounterDate}T${hours.padStart(2, '0')}:${(parseInt(minutes) + 15).toString().padStart(2, '0')}:00.000Z`,
    },
    reasonCode: [
      {
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-10-cm",
            code: formData.reasonCode,
            display: ENCOUNTER_TYPES[formData.encounterType].reasonCodes.find(
              r => r.code === formData.reasonCode
            )?.display || formData.reasonCode,
            userSelected: true
          },
        ],
      },
    ],
  };

  const result = await fhirClient.createEncounter(encounter);
  console.log("Encounter created successfully", result);
  return result;
};

/**
 * Validates that all form data is provided and valid
 */
export const validateEncounterForm = (formData: Partial<EncounterFormData>): string[] => {
  const errors: string[] = [];

  if (!formData.encounterDate) {
    errors.push('Encounter date is required');
  }

  if (!formData.encounterType) {
    errors.push('Encounter type is required');
  } else if (!ENCOUNTER_TYPES[formData.encounterType]) {
    errors.push('Invalid encounter type selected');
  }

  if (!formData.reasonCode) {
    errors.push('Reason code (ICD-10) is required');
  } else if (formData.encounterType) {
    const validReasonCodes = ENCOUNTER_TYPES[formData.encounterType]?.reasonCodes.map(r => r.code) || [];
    if (!validReasonCodes.includes(formData.reasonCode)) {
      errors.push('Selected reason code is not valid for this encounter type');
    }
  }

  return errors;
};