// src/utils/conditionCreation.ts
import { fhirClient } from '../services/fhirClient';
import type { Condition } from 'fhir/r4';

export interface ConditionFormData {
  onsetDate: string;
  conditionCode: string; // ICD-10 code
  conditionSystem?: string; // Defaults to ICD-10
  category?: 'problem-list-item' | 'health-concern'; // Defaults to problem-list-item
}

/**
 * ICD-10 codes for high BMI conditions (Overweight or Obese)
 * Based on "Overweight or Obese" valueset from CMS69
 */
export const HIGH_BMI_CONDITION_CODES = {
  'E66.3': {
    code: 'E66.3',
    display: 'Overweight',
    system: 'http://hl7.org/fhir/sid/icd-10-cm',
    description: 'BMI 25-29.9 kg/m²'
  },
  'E66.811': {
    code: 'E66.811',
    display: 'Obesity, class 1 (BMI 30-34.9)',
    system: 'http://hl7.org/fhir/sid/icd-10-cm',
    description: 'BMI 30-34.9 kg/m²'
  },
  'E66.812': {
    code: 'E66.812',
    display: 'Obesity, class 2 (BMI 35-39.9)',
    system: 'http://hl7.org/fhir/sid/icd-10-cm',
    description: 'BMI 35-39.9 kg/m²'
  },
  'E66.813': {
    code: 'E66.813',
    display: 'Obesity, class 3 (BMI ≥40)',
    system: 'http://hl7.org/fhir/sid/icd-10-cm',
    description: 'BMI ≥40 kg/m²'
  }
} as const;

/**
 * ICD-10 codes for low BMI conditions (Underweight)
 * Based on "Underweight" valueset from CMS69
 */
export const LOW_BMI_CONDITION_CODES = {
  'E46': {
    code: 'E46',
    display: 'Unspecified protein-calorie malnutrition',
    system: 'http://hl7.org/fhir/sid/icd-10-cm',
    description: 'BMI <18.5 kg/m²'
  }
} as const;

/**
 * Create a Condition resource for BMI diagnosis
 */
const createConditionResource = (
  patientId: string,
  conditionCode: string,
  onsetDateTime: string,
  category: 'problem-list-item' | 'health-concern' = 'problem-list-item'
): Condition => {
  // Find the condition code details from our mappings
  const highBMICode = Object.values(HIGH_BMI_CONDITION_CODES).find(c => c.code === conditionCode);
  const lowBMICode = Object.values(LOW_BMI_CONDITION_CODES).find(c => c.code === conditionCode);
  const conditionCodeEntry = highBMICode || lowBMICode;

  if (!conditionCodeEntry) {
    throw new Error(`Invalid condition code: ${conditionCode}`);
  }

  return {
    resourceType: 'Condition',
    meta: {
      profile: ['http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-condition-problems-health-concerns']
    },
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active'
        }
      ]
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed'
        }
      ]
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: category,
            display: category === 'problem-list-item' ? 'Problem List Item' : 'Health Concern'
          }
        ]
      }
    ],
    code: {
      coding: [
        {
          system: conditionCodeEntry.system,
          code: conditionCodeEntry.code,
          display: conditionCodeEntry.display,
          userSelected: true
        }
      ],
      text: conditionCodeEntry.display
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    onsetDateTime: onsetDateTime
  };
};

/**
 * Creates a Condition resource for BMI diagnosis
 */
export const createBMICondition = async (
  patientId: string,
  formData: ConditionFormData
): Promise<Condition> => {
  const dateTime = `${formData.onsetDate}T00:00:00.000Z`;

  // Create the Condition resource
  const condition = createConditionResource(
    patientId,
    formData.conditionCode,
    dateTime,
    formData.category || 'problem-list-item'
  );

  try {
    const result = await fhirClient.createCondition(condition);

    console.log('BMI condition created successfully', {
      condition: result
    });

    return result;
  } catch (error) {
    console.error('Failed to create BMI condition:', error);
    throw error;
  }
};

/**
 * Validates BMI condition form data
 */
export const validateConditionForm = (formData: Partial<ConditionFormData>): string[] => {
  const errors: string[] = [];

  if (!formData.onsetDate) {
    errors.push('Onset date is required');
  } else {
    const selectedDate = new Date(formData.onsetDate);
    const today = new Date();
    if (selectedDate > today) {
      errors.push('Onset date cannot be in the future');
    }
  }

  if (!formData.conditionCode) {
    errors.push('Condition code is required');
  }

  return errors;
};
