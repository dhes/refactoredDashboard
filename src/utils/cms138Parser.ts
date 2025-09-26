// src/utils/cms138Parser.ts
export interface CMS138Parameter {
  name: string;
  value: boolean | number | string | null | 'empty-list' | 'resource';
  rawValue?: any;
}

export interface CMS138Result {
  practitionerAlert: boolean; // true when any Patient Score [n] = 0 (eligible but no intervention)
  initialPopulation: boolean | null;
  denominators: Record<string, boolean | null>;
  numerators: Record<string, boolean | null>;
  patientScores: Record<string, number | null>; // Changed to number for integer scores
  exclusions: Record<string, boolean | null>;
  ecqmExclusionReason: string | null; // New field for exclusion reason
  specificActions: string[]; // New field for specific patient score actions
  qualifyingEncounters: any[]; // Encounters from "Qualifying Visit During Measurement Period"
  preventiveEncounters: any[]; // Encounters from "Preventive Visit During Measurement Period"
  tobaccoCessationOrdered: any[]; // Medications from "Tobacco Cessation Pharmacotherapy Ordered"
  tobaccoCessationActive: any[]; // Medications from "Active Pharmacotherapy for Tobacco Cessation"
  tobaccoNonUserObservation: any | null; // Observation from "Most Recent Tobacco Use Screening Indicates Tobacco Non User"
  tobaccoUserObservation: any | null; // Observation from "Most Recent Tobacco Use Screening Indicates Tobacco User"
  tobaccoCessationCounseling: any[]; // Procedures from "Tobacco Cessation Counseling Given"
  allGoalsMet: string | false; // String message from "All Goals Met" or false
  otherParameters: CMS138Parameter[];
  allParameters: CMS138Parameter[];
}

export function parseParameterValue(param: any): boolean | number | string | null | 'empty-list' | 'resource' {
  // Handle simple boolean values
  if (typeof param.valueBoolean === 'boolean') {
    return param.valueBoolean;
  }

  // Handle integer values (like Patient Score [n])
  if (typeof param.valueInteger === 'number') {
    return param.valueInteger;
  }

  // Handle string values (like exclusion reasons)
  if (typeof param.valueString === 'string') {
    return param.valueString;
  }

  // Handle resource types
  if (param.resource) {
    return 'resource';
  }

  // Handle extended booleans with extensions
  if (param._valueBoolean?.extension) {
    const extensions = param._valueBoolean.extension;
    
    // Check for data-absent-reason (null values)
    const absentReason = extensions.find((ext: any) => 
      ext.url === 'http://hl7.org/fhir/StructureDefinition/data-absent-reason'
    );
    if (absentReason) {
      return null;
    }

    // Check for empty list
    const emptyList = extensions.find((ext: any) => 
      ext.url === 'http://hl7.org/fhir/StructureDefinition/cqf-isEmptyList'
    );
    if (emptyList?.valueBoolean === true) {
      return 'empty-list';
    }
  }

  // Default to null for unrecognized structures
  return null;
}

export function processCMS138Response(response: any): CMS138Result {
  const parameters = response.parameter || [];
  const allParameters: CMS138Parameter[] = [];
  
  const denominators: Record<string, boolean | null> = {};
  const numerators: Record<string, boolean | null> = {};
  const patientScores: Record<string, number | null> = {}; // Changed to number
  const exclusions: Record<string, boolean | null> = {};
  let initialPopulation: boolean | null = null;
  let ecqmExclusionReason: string | null = null;
  const specificActions: string[] = [];
  const qualifyingEncounters: any[] = [];
  const preventiveEncounters: any[] = [];
  const tobaccoCessationOrdered: any[] = [];
  const tobaccoCessationActive: any[] = [];
  let tobaccoNonUserObservation: any | null = null;
  let tobaccoUserObservation: any | null = null;
  const tobaccoCessationCounseling: any[] = [];
  let allGoalsMet: string | false = false;
  const otherParameters: CMS138Parameter[] = [];

  parameters.forEach((param: any) => {
    const name = param.name;
    const value = parseParameterValue(param);
    
    const cms138Param: CMS138Parameter = {
      name,
      value,
      rawValue: param
    };
    
    allParameters.push(cms138Param);

    // Handle encounter resources first (before skipping resource types)
    if (name === 'Qualifying Visit During Measurement Period') {
      // Extract encounter resources
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          qualifyingEncounters.push(...param.resource);
        } else {
          qualifyingEncounters.push(param.resource);
        }
      }
    } else if (name === 'Preventive Visit During Measurement Period') {
      // Extract encounter resources  
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          preventiveEncounters.push(...param.resource);
        } else {
          preventiveEncounters.push(param.resource);
        }
      }
    } else if (name === 'Tobacco Cessation Pharmacotherapy Ordered') {
      // Extract medication request resources
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          tobaccoCessationOrdered.push(...param.resource);
        } else {
          tobaccoCessationOrdered.push(param.resource);
        }
      }
    } else if (name === 'Active Pharmacotherapy for Tobacco Cessation') {
      // Extract medication request resources
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          tobaccoCessationActive.push(...param.resource);
        } else {
          tobaccoCessationActive.push(param.resource);
        }
      }
    } else if (name === 'Most Recent Tobacco Use Screening Indicates Tobacco Non User') {
      // Extract tobacco non-user observation
      if (value === 'resource' && param.resource) {
        tobaccoNonUserObservation = param.resource;
      }
    } else if (name === 'Most Recent Tobacco Use Screening Indicates Tobacco User') {
      // Extract tobacco user observation
      if (value === 'resource' && param.resource) {
        tobaccoUserObservation = param.resource;
      }
    } else if (name === 'Tobacco Cessation Counseling Given') {
      // Extract tobacco cessation counseling procedures
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          tobaccoCessationCounseling.push(...param.resource);
        } else {
          tobaccoCessationCounseling.push(param.resource);
        }
      }
    } else if (name === 'All Goals Met') {
      // Extract all goals met message (string) or false
      if (typeof value === 'string') {
        allGoalsMet = value;
      }
    }

    // Skip resource types for other processing
    if (value === 'resource') {
      return;
    }

    // Categorize parameters
    if (name === 'Initial Population') {
      initialPopulation = value === 'empty-list' ? null : value as boolean | null;
    } else if (name === 'eCQM Initial Population Exclusion Reason') {
      ecqmExclusionReason = value === 'empty-list' || value === null ? null : value as string;
    } else if (name.includes('Patient Score') && name.includes('is 0')) {
      // Capture specific patient score actions
      if (typeof value === 'string') {
        specificActions.push(value);
      }
    } else if (name.startsWith('Denominator') && name.includes('Exclusion')) {
      exclusions[name] = value === 'empty-list' ? null : value as boolean | null;
    } else if (name.startsWith('Denominator')) {
      denominators[name] = value === 'empty-list' ? null : value as boolean | null;
    } else if (name.startsWith('Numerator')) {
      numerators[name] = value === 'empty-list' ? null : value as boolean | null;
    } else if (name.startsWith('Patient Score')) {
      patientScores[name] = value === 'empty-list' ? null : value as number | null;
    } else if (value !== 'empty-list' && value !== null) {
      // Include non-null, non-empty parameters
      otherParameters.push(cms138Param);
    }
  });

  // Determine practitioner alert: any Patient Score = 0 (eligible but no intervention)
  const practitionerAlert = Object.values(patientScores).some(score => score === 0);

  return {
    practitionerAlert,
    initialPopulation,
    denominators,
    numerators,
    patientScores,
    exclusions,
    ecqmExclusionReason,
    specificActions,
    qualifyingEncounters,
    preventiveEncounters,
    tobaccoCessationOrdered,
    tobaccoCessationActive,
    tobaccoNonUserObservation,
    tobaccoUserObservation,
    tobaccoCessationCounseling,
    allGoalsMet,
    otherParameters,
    allParameters
  };
}

export function formatParameterValue(value: boolean | number | string | null | 'empty-list' | 'resource'): string {
  switch (value) {
    case true:
      return 'True';
    case false:
      return 'False';
    case 0:
      return '0 (Eligible, No Intervention)';
    case 1:
      return '1 (Intervention Documented)';
    case null:
      return 'Null';
    case 'empty-list':
      return 'Empty List';
    case 'resource':
      return 'Resource';
    default:
      if (typeof value === 'number') {
        return value.toString();
      }
      if (typeof value === 'string') {
        return value;
      }
      return 'Unknown';
  }
}

export function getParameterValueColor(value: boolean | number | string | null | 'empty-list' | 'resource'): string {
  switch (value) {
    case true:
      return 'text-green-700 bg-green-100';
    case false:
      return 'text-red-700 bg-red-100';
    case 0:
      return 'text-red-700 bg-red-100'; // Alert: eligible but no intervention
    case 1:
      return 'text-green-700 bg-green-100'; // Good: intervention documented
    case null:
      return 'text-gray-700 bg-gray-100';
    case 'empty-list':
      return 'text-yellow-700 bg-yellow-100';
    case 'resource':
      return 'text-blue-700 bg-blue-100';
    default:
      if (typeof value === 'number') {
        return 'text-blue-700 bg-blue-100';
      }
      if (typeof value === 'string') {
        return 'text-gray-700 bg-gray-100';
      }
      return 'text-gray-700 bg-gray-100';
  }
}