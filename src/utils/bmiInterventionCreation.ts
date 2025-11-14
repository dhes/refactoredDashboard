// src/utils/bmiInterventionCreation.ts
import { fhirClient } from '../services/fhirClient';
import type { Procedure } from 'fhir/r4';

export interface BMIInterventionFormData {
  date: string;
  time?: string;
  interventionType: 'dietary-regime';
  conditionId?: string; // Reference to Condition resource (e.g., "5915")
}

/**
 * Intervention type configuration
 */
export const INTERVENTION_TYPES = {
  'dietary-regime': {
    code: '182922004',
    display: 'Dietary regime (regime/therapy)',
    system: 'http://snomed.info/sct',
    version: '2022-03'
  }
} as const;

/**
 * Reason codes for BMI interventions (from "Overweight or Obese" valueset)
 */
export const BMI_REASON_CODES = {
  'overweight': {
    code: '162863004',
    display: 'Body mass index 25-29 - overweight (finding)',
    system: 'http://snomed.info/sct',
    version: '2022-03'
  },
  'obese': {
    code: '162864005',
    display: 'Body mass index 30+ - obesity (finding)',
    system: 'http://snomed.info/sct',
    version: '2022-03'
  }
} as const;

/**
 * Create a Procedure resource for BMI intervention
 */
const createProcedureResource = (
  patientId: string,
  interventionType: keyof typeof INTERVENTION_TYPES,
  conditionId: string | undefined,
  dateTime: string
): Procedure => {
  const intervention = INTERVENTION_TYPES[interventionType];

  const procedure: Procedure = {
    resourceType: 'Procedure',
    meta: {
      profile: ['http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-procedure']
    },
    extension: [
      {
        url: 'http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-recorded',
        valueDateTime: dateTime
      }
    ],
    status: 'completed',
    code: {
      coding: [
        {
          system: intervention.system,
          version: intervention.version,
          code: intervention.code,
          display: intervention.display,
          userSelected: true
        }
      ]
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    performedDateTime: dateTime
  };

  // Use reasonReference if Condition ID provided (preferred approach)
  if (conditionId) {
    procedure.reasonReference = [
      {
        reference: `Condition/${conditionId}`
      }
    ];
  }

  return procedure;
};

/**
 * Creates a BMI intervention Procedure
 */
export const createBMIIntervention = async (
  patientId: string,
  formData: BMIInterventionFormData
): Promise<Procedure> => {
  // Parse time or use default
  const timeString = formData.time || new Date().toTimeString().slice(0, 5);
  const [hours, minutes] = timeString.split(':');

  const dateTime = `${formData.date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00.000Z`;

  // Create the Procedure resource
  const procedure = createProcedureResource(patientId, formData.interventionType, formData.conditionId, dateTime);

  try {
    const result = await fhirClient.createProcedure(procedure);

    console.log('BMI intervention created successfully', {
      procedure: result
    });

    return result;
  } catch (error) {
    console.error('Failed to create BMI intervention:', error);
    throw error;
  }
};

/**
 * Validates BMI intervention form data
 */
export const validateBMIInterventionForm = (formData: Partial<BMIInterventionFormData>): string[] => {
  const errors: string[] = [];

  if (!formData.date) {
    errors.push('Date is required');
  } else {
    const selectedDate = new Date(formData.date);
    const today = new Date();
    if (selectedDate > today) {
      errors.push('Date cannot be in the future');
    }
  }

  if (!formData.interventionType) {
    errors.push('Intervention type is required');
  }

  // Condition ID is optional - procedure can exist without reasonReference
  // But we'll warn if missing
  if (!formData.conditionId) {
    console.warn('No Condition ID provided - Procedure will not have reasonReference');
  }

  return errors;
};
