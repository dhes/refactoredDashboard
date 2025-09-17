// src/utils/hospiceEvidenceExtractor.ts

export interface HospiceEvidence {
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
    specialDetails: resource.valueCodeableConcept?.coding?.[0]?.display // e.g., "Yes (qualifier value)"
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
export function processHospiceEvidence(evaluateResponse: any): {
  hasHospiceServices: boolean;
  evidenceList: HospiceEvidence[];
  evidenceByCategory: Record<string, HospiceEvidence[]>;
} {
  const evidenceList: HospiceEvidence[] = [];
  let hasHospiceServices = false;

  // Check if response has parameters
  if (!evaluateResponse.parameter) {
    return { hasHospiceServices: false, evidenceList: [], evidenceByCategory: {} };
  }

  for (const param of evaluateResponse.parameter) {
    // Check for overall result
    if (param.name === 'Has Hospice Services' && param.valueBoolean !== undefined) {
      hasHospiceServices = param.valueBoolean;
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
  const evidenceByCategory: Record<string, HospiceEvidence[]> = {};
  evidenceList.forEach(evidence => {
    if (!evidenceByCategory[evidence.category]) {
      evidenceByCategory[evidence.category] = [];
    }
    evidenceByCategory[evidence.category].push(evidence);
  });

  return {
    hasHospiceServices,
    evidenceList: evidenceList.sort((a, b) => b.date.localeCompare(a.date)), // Sort by date descending
    evidenceByCategory
  };
}

// Category display mapping
export const HOSPICE_CATEGORIES = {
  'Inpatient Encounter': {
    label: 'Inpatient Encounters with Hospice Discharge',
    icon: '🏥',
    description: 'Inpatient encounters ending with discharge to hospice care'
  },
  // 'WithHospiceEncounter': {
  //   label: 'Hospice Encounters',
  //   icon: '🏠',
  //   description: 'Direct hospice care encounters'
  // },
  'Encounter Hospice': {
    label: 'Hospice Encounters',
    icon: '🏠',
    description: 'Direct hospice care encounters'
  },
  'Hospice Assessment': {
    label: 'Hospice Assessments',
    icon: '📋',
    description: 'Hospice care assessments and screenings'
  },
  'Hospice Order': {
    label: 'Hospice Service Orders',
    icon: '🩺',
    description: 'Orders for hospice care services'
  },
  'Hospice Performed': {
    label: 'Hospice Procedures',
    icon: '🔬',
    description: 'Performed hospice care procedures'
  },
  'Hospice Problem Diagnosis': {
    label: 'Hospice Problem Diagnoses',
    icon: '🔍',
    description: 'Hospice-related problem list diagnoses'
  },
  'Hospice Encounter Diagnosis': {
    label: 'Hospice Encounter Diagnoses',
    icon: '📝',
    description: 'Hospice-related encounter diagnoses'
  }
} as const;