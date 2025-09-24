// src/utils/encounterCreation.ts
import { fhirClient } from '../services/fhirClient';
import { getCodeSystem, getCodeDisplay } from './medicalCodes';

export interface EncounterFormData {
  encounterDate: string;
  icd10: string;
  cpt: string;
}

/**
 * Creates a new FHIR Encounter resource with the provided form data
 * Originally designed to help patients qualify for Initial Population by creating encounters
 */
export const createEncounter = async (
  patientId: string, 
  formData: EncounterFormData
): Promise<any> => {
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
            system: getCodeSystem(formData.cpt),
            code: formData.cpt,
            display: getCodeDisplay(formData.cpt),
          },
        ],
      },
    ],
    subject: {
      reference: `Patient/${patientId}`,
    },
    period: {
      start: `${formData.encounterDate}T08:00:00.000Z`,
      end: `${formData.encounterDate}T08:15:00.000Z`,
    },
    reasonCode: [
      {
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-10-cm",
            code: formData.icd10,
            display: `ICD-10 ${formData.icd10}`,
          },
        ],
      },
    ],
  };

  const result = await fhirClient.createEncounter(encounter);
  console.log("Encounter created successfully", result);
  return result;
};