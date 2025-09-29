// src/utils/palliativeCareEvidenceExtractor.ts

export interface PalliativeCareEvidence {
  category: string;
  resourceType: string;
  resourceId: string;
  date: string;
  displayDate: string;
  code: string;
  system: string;
  display: string;
  systemAbbrev: string;
  fullResource: any;
  specialDetails?: string; // For discharge disposition, etc.
}

// Resource-specific extraction functions
const resourceExtractors = {
  Observation: (resource: any) => ({
    date: resource.effectiveDateTime || resource.effectivePeriod?.start || '',
    code: resource.code?.coding?.[0]?.code || '',
    system: resource.code?.coding?.[0]?.system || '',
    display: resource.code?.coding?.[0]?.display || 'Unknown observation',
    specialDetails: resource.valueCodeableConcept?.coding?.[0]?.display // e.g., assessment results
  }),

  ServiceRequest: (resource: any) => ({
    date: resource.authoredOn || '',
    code: resource.code?.coding?.[0]?.code || '',
    system: resource.code?.coding?.[0]?.system || '',
    display: resource.code?.coding?.[0]?.display || 'Unknown service request',
    specialDetails: resource.intent ? `Intent: ${resource.intent}` : undefined
  }),

  Encounter: (resource: any) => ({
    date: resource.period?.start || '',
    code: resource.type?.[0]?.coding?.[0]?.code || '',
    system: resource.type?.[0]?.coding?.[0]?.system || '',
    display: resource.type?.[0]?.coding?.[0]?.display || 'Unknown encounter type',
    specialDetails: resource.hospitalization?.dischargeDisposition?.coding?.[0]?.display || 
                   resource.class?.display
  }),

  Procedure: (resource: any) => ({
    date: resource.performedDateTime || resource.performedPeriod?.start || '',
    code: resource.code?.coding?.[0]?.code || '',
    system: resource.code?.coding?.[0]?.system || '',
    display: resource.code?.coding?.[0]?.display || 'Unknown procedure',
    specialDetails: resource.status ? `Status: ${resource.status}` : undefined
  }),

  Condition: (resource: any) => ({
    date: resource.recordedDate || resource.onsetDateTime || resource.onsetPeriod?.start || '',
    code: resource.code?.coding?.[0]?.code || '',
    system: resource.code?.coding?.[0]?.system || '',
    display: resource.code?.coding?.[0]?.display || 'Unknown condition',
    specialDetails: resource.clinicalStatus?.coding?.[0]?.display
  })
};

// Helper to get system abbreviation
function getSystemAbbreviation(system: string): string {
  if (system.includes('snomed.info')) return 'SNOMED-CT';
  if (system.includes('loinc.org')) return 'LOINC';
  if (system.includes('hl7.org/fhir/sid/icd-10')) return 'ICD-10';
  if (system.includes('ama-assn.org/go/cpt')) return 'CPT';
  return system.split('/').pop() || 'Unknown';
}

// Main processing function
export function processPalliativeCareEvidence(evaluateResponse: any): {
  hasPalliativeCare: boolean;
  evidenceList: PalliativeCareEvidence[];
  evidenceByCategory: Record<string, PalliativeCareEvidence[]>;
} {
  const evidenceList: PalliativeCareEvidence[] = [];
  let hasPalliativeCare = false;

  // Check if response has parameters
  if (!evaluateResponse.parameter) {
    return { hasPalliativeCare: false, evidenceList: [], evidenceByCategory: {} };
  }

  for (const param of evaluateResponse.parameter) {
    // Check for overall result
    if (param.name === 'Has Palliative Care in the Measurement Period' && param.valueBoolean !== undefined) {
      hasPalliativeCare = param.valueBoolean;
      continue;
    }

    // Process evidence categories (skip Patient resource)
    if (param.resource && param.resource.resourceType !== 'Patient') {
      const resource = param.resource;
      const extractor = resourceExtractors[resource.resourceType as keyof typeof resourceExtractors];

      if (extractor) {
        const extracted = extractor(resource);
        
        evidenceList.push({
          category: param.name,
          resourceType: resource.resourceType,
          resourceId: resource.id || 'unknown',
          date: extracted.date,
          displayDate: extracted.date ? new Date(extracted.date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown',
          code: extracted.code,
          system: extracted.system,
          display: extracted.display,
          systemAbbrev: getSystemAbbreviation(extracted.system),
          fullResource: resource,
          specialDetails: extracted.specialDetails
        });
      }
    }
  }

  // Group evidence by category
  const evidenceByCategory: Record<string, PalliativeCareEvidence[]> = {};
  evidenceList.forEach(evidence => {
    if (!evidenceByCategory[evidence.category]) {
      evidenceByCategory[evidence.category] = [];
    }
    evidenceByCategory[evidence.category].push(evidence);
  });

  return {
    hasPalliativeCare,
    evidenceList: evidenceList.sort((a, b) => b.date.localeCompare(a.date)), // Sort by date descending
    evidenceByCategory
  };
}

// Category display mapping based on our refactored PalliativeCare definitions
export const PALLIATIVE_CARE_CATEGORIES = {
  'Palliative Care Assessment': {
    label: 'Palliative Care Assessments',
    icon: '📋',
    description: 'FACIT-Pal questionnaires and palliative care assessments'
  },
  'Palliative Care Problem Diagnosis': {
    label: 'Palliative Care Problem Diagnoses',
    icon: '🔍',
    description: 'Palliative care diagnoses on problem list'
  },
  'Palliative Care Encounter Diagnosis': {
    label: 'Palliative Care Encounter Diagnoses',
    icon: '📝',
    description: 'Palliative care diagnoses documented during encounters'
  },
  'Palliative Care Encounters': {
    label: 'Palliative Care Encounters',
    icon: '🏥',
    description: 'Encounters specifically for palliative care services'
  },
  'Palliative Care Interventions': {
    label: 'Palliative Care Interventions',
    icon: '🔬',
    description: 'Performed palliative care procedures and interventions'
  }
} as const;