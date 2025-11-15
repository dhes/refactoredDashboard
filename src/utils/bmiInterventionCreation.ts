// src/utils/bmiInterventionCreation.ts
import { fhirClient } from '../services/fhirClient';
import type { Procedure, ServiceRequest, MedicationRequest } from 'fhir/r4';

export type InterventionResourceType = 'procedure' | 'service-request' | 'medication-request';

export interface BMIInterventionFormData {
  date: string;
  time?: string;
  resourceType: InterventionResourceType; // Which FHIR resource to create
  interventionCode: string; // The specific intervention code (182922004, 183515008, etc.)
  conditionId?: string; // Reference to Condition resource (e.g., "5915")
}

/**
 * Procedure intervention codes (from "Follow Up for Above Normal BMI" valueset)
 */
export const PROCEDURE_INTERVENTIONS = {
  'dietary-regime': {
    code: '182922004',
    display: 'Dietary regime (regime/therapy)',
    system: 'http://snomed.info/sct',
    version: '2022-03'
  }
} as const;

/**
 * ServiceRequest intervention codes
 */
export const SERVICE_REQUEST_INTERVENTIONS = {
  'dietary-regime-order': {
    code: '182922004',
    display: 'Dietary regime (regime/therapy)',
    system: 'http://snomed.info/sct',
    version: '2022-03'
  },
  'referral-to-physician': {
    code: '183515008',
    display: 'Referral to physician (procedure)',
    system: 'http://snomed.info/sct',
    version: '2022-03'
  }
} as const;

/**
 * MedicationRequest intervention codes (from "Medications for Above Normal BMI" valueset)
 */
export const MEDICATION_REQUEST_INTERVENTIONS = {
  'phentermine': {
    code: '1112982',
    display: 'phentermine hydrochloride 15 MG Disintegrating Oral Tablet',
    system: 'http://www.nlm.nih.gov/research/umls/rxnorm'
  },
  'dronabinol': {
    code: '1928948',
    display: 'dronabinol 5 MG/ML Oral Solution',
    system: 'http://www.nlm.nih.gov/research/umls/rxnorm'
  }
} as const;

/**
 * Helper to find intervention config by code
 */
const findInterventionByCode = (code: string) => {
  // Search Procedures
  const procedureEntry = Object.values(PROCEDURE_INTERVENTIONS).find(i => i.code === code);
  if (procedureEntry) return procedureEntry;

  // Search ServiceRequests
  const serviceEntry = Object.values(SERVICE_REQUEST_INTERVENTIONS).find(i => i.code === code);
  if (serviceEntry) return serviceEntry;

  // Search MedicationRequests
  const medicationEntry = Object.values(MEDICATION_REQUEST_INTERVENTIONS).find(i => i.code === code);
  if (medicationEntry) return medicationEntry;

  throw new Error(`Unknown intervention code: ${code}`);
};

/**
 * Create a Procedure resource for BMI intervention
 */
const createProcedureResource = (
  patientId: string,
  interventionCode: string,
  conditionId: string | undefined,
  dateTime: string
): Procedure => {
  const intervention = findInterventionByCode(interventionCode);

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
 * Create a ServiceRequest resource for BMI intervention
 */
const createServiceRequestResource = (
  patientId: string,
  interventionCode: string,
  conditionId: string | undefined,
  dateTime: string
): ServiceRequest => {
  const intervention = findInterventionByCode(interventionCode);

  const serviceRequest: ServiceRequest = {
    resourceType: 'ServiceRequest',
    meta: {
      profile: ['http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-servicerequest']
    },
    status: 'active',
    intent: 'order',
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
    authoredOn: dateTime
  };

  // Use reasonReference if Condition ID provided
  if (conditionId) {
    serviceRequest.reasonReference = [
      {
        reference: `Condition/${conditionId}`
      }
    ];
  }

  return serviceRequest;
};

/**
 * Create a MedicationRequest resource for BMI intervention
 */
const createMedicationRequestResource = (
  patientId: string,
  interventionCode: string,
  conditionId: string | undefined,
  dateTime: string
): MedicationRequest => {
  const intervention = findInterventionByCode(interventionCode);

  const medicationRequest: MedicationRequest = {
    resourceType: 'MedicationRequest',
    meta: {
      profile: ['http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-medicationrequest']
    },
    status: 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [
        {
          system: intervention.system,
          code: intervention.code,
          display: intervention.display,
          userSelected: true
        }
      ]
    },
    subject: {
      reference: `Patient/${patientId}`
    },
    authoredOn: dateTime
  };

  // Use reasonReference if Condition ID provided
  if (conditionId) {
    medicationRequest.reasonReference = [
      {
        reference: `Condition/${conditionId}`
      }
    ];
  }

  return medicationRequest;
};

/**
 * Creates a BMI intervention (Procedure, ServiceRequest, or MedicationRequest)
 */
export const createBMIIntervention = async (
  patientId: string,
  formData: BMIInterventionFormData
): Promise<Procedure | ServiceRequest | MedicationRequest> => {
  // Parse time or use default
  const timeString = formData.time || new Date().toTimeString().slice(0, 5);
  const [hours, minutes] = timeString.split(':');

  const dateTime = `${formData.date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00.000Z`;

  try {
    let result: Procedure | ServiceRequest | MedicationRequest;

    switch (formData.resourceType) {
      case 'procedure': {
        const procedure = createProcedureResource(patientId, formData.interventionCode, formData.conditionId, dateTime);
        result = await fhirClient.createProcedure(procedure);
        console.log('BMI Procedure created successfully', { procedure: result });
        break;
      }
      case 'service-request': {
        const serviceRequest = createServiceRequestResource(patientId, formData.interventionCode, formData.conditionId, dateTime);
        result = await fhirClient.createServiceRequest(serviceRequest);
        console.log('BMI ServiceRequest created successfully', { serviceRequest: result });
        break;
      }
      case 'medication-request': {
        const medicationRequest = createMedicationRequestResource(patientId, formData.interventionCode, formData.conditionId, dateTime);
        result = await fhirClient.createMedicationRequest(medicationRequest);
        console.log('BMI MedicationRequest created successfully', { medicationRequest: result });
        break;
      }
      default:
        throw new Error(`Unknown resource type: ${formData.resourceType}`);
    }

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

  if (!formData.resourceType) {
    errors.push('Resource type is required');
  }

  if (!formData.interventionCode) {
    errors.push('Intervention code is required');
  }

  // Condition ID is optional - resource can exist without reasonReference
  // But we'll warn if missing
  if (!formData.conditionId) {
    console.warn('No Condition ID provided - Resource will not have reasonReference');
  }

  return errors;
};
