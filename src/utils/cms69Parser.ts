// src/utils/cms69Parser.ts
export interface CMS69Parameter {
  name: string;
  value: boolean | number | string | null | 'empty-list' | 'resource';
  rawValue?: any;
}

export interface BMIObservation {
  id: string;
  value: number;
  unit: string;
  effectiveDate: string;
  displayDate: string;
  status: string;
}

export interface CMS69Result {
  practitionerAlert: boolean; // true when Patient Score = 0 (eligible but no intervention)
  initialPopulation: boolean | null;
  denominator: boolean | null;
  numerator: boolean | null;
  patientScore: number | null;
  denominatorExclusions: boolean | null;
  denominatorExceptions: boolean | null;
  ecqmExclusionReason: string | null;
  specificActions: string[];
  
  // BMI-specific data
  bmiObservations: BMIObservation[]; // From "BMI During Measurement Period"
  hasNormalBMI: boolean | null; // From "Has Normal BMI"
  documentedHighBMI: BMIObservation[]; // From "Documented High BMI During Measurement Period"
  documentedLowBMI: BMIObservation[]; // From "Documented Low BMI During Measurement Period"
  isPregnant: boolean | null; // From "Is Pregnant During Day Of Measurement Period"
  
  // Intervention data
  highBMIFollowUp: any[]; // From "High BMI And Follow Up Provided"
  lowBMIFollowUp: any[]; // From "Low BMI And Follow Up Provided"
  highBMIInterventionsPerformed: any[]; // From "High BMI Interventions Performed"
  lowBMIInterventionsPerformed: any[]; // From "Low BMI Interventions Performed"
  highBMIFollowUpBanner: string | null; // From "High BMI Follow Up Banner"
  lowBMIFollowUpBanner: string | null; // From "Low BMI Follow Up Banner"
  needsScreeningBanner: string | null; // From "Needs Screening Banner"
  denominatorExceptionBanner: string | null; // From "Denominator Exception Banner"
  
  // New dynamic exception banner data
  bmiExceptionBannerText?: string; // From "BMI Exception Banner Text"
  bmiExceptionCategory?: 'Medical Reason' | 'Patient Reason' | 'Unknown Reason'; // From "BMI Not Done Category"
  bmiExceptionDetail?: string; // From "BMI Not Done Reason Display"
  
  // BMI Follow-Up exception banner data
  bmiFollowUpExceptionBannerText?: string; // From "BMI Follow-Up Exception Banner Text"
  bmiFollowUpExceptionCategory?: 'Medical Reason' | 'Patient Reason' | 'Unknown Reason'; // From "BMI Follow-Up Not Done Category"
  bmiFollowUpExceptionDetail?: string; // From "BMI Follow-Up Not Done Reason Display"
  
  allGoalsMet: string | false;
  otherParameters: CMS69Parameter[];
  allParameters: CMS69Parameter[];
}

export function parseParameterValue(param: any): boolean | number | string | null | 'empty-list' | 'resource' {
  // Handle simple boolean values
  if (typeof param.valueBoolean === 'boolean') {
    return param.valueBoolean;
  }

  // Handle integer values (like Patient Score)
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

function processBMIObservation(resource: any): BMIObservation {
  const value = resource.valueQuantity?.value || 0;
  const unit = resource.valueQuantity?.unit || 'kg/m2';
  const effectiveDate = resource.effectiveDateTime || resource.effectivePeriod?.start || '';
  
  return {
    id: resource.id || 'unknown',
    value: value,
    unit: unit,
    effectiveDate: effectiveDate,
    displayDate: effectiveDate ? new Date(effectiveDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown',
    status: resource.status || 'unknown'
  };
}

export function processCMS69Response(response: any): CMS69Result {
  const parameters = response.parameter || [];
  const allParameters: CMS69Parameter[] = [];
  
  let denominator: boolean | null = null;
  let numerator: boolean | null = null;
  let patientScore: number | null = null;
  let denominatorExclusions: boolean | null = null;
  let denominatorExceptions: boolean | null = null;
  let initialPopulation: boolean | null = null;
  let ecqmExclusionReason: string | null = null;
  const specificActions: string[] = [];
  
  // BMI-specific data
  const bmiObservations: BMIObservation[] = [];
  let hasNormalBMI: boolean | null = null;
  const documentedHighBMI: BMIObservation[] = [];
  const documentedLowBMI: BMIObservation[] = [];
  const highBMIFollowUp: any[] = [];
  const lowBMIFollowUp: any[] = [];
  const highBMIInterventionsPerformed: any[] = [];
  const lowBMIInterventionsPerformed: any[] = [];
  let highBMIFollowUpBanner: string | null = null;
  let lowBMIFollowUpBanner: string | null = null;
  let needsScreeningBanner: string | null = null;
  let denominatorExceptionBanner: string | null = null;
  let isPregnant: boolean | null = null;
  
  // New dynamic exception banner variables
  let bmiExceptionBannerText: string | undefined = undefined;
  let bmiExceptionCategory: 'Medical Reason' | 'Patient Reason' | 'Unknown Reason' | undefined = undefined;
  let bmiExceptionDetail: string | undefined = undefined;
  
  // BMI Follow-Up exception banner variables
  let bmiFollowUpExceptionBannerText: string | undefined = undefined;
  let bmiFollowUpExceptionCategory: 'Medical Reason' | 'Patient Reason' | 'Unknown Reason' | undefined = undefined;
  let bmiFollowUpExceptionDetail: string | undefined = undefined;
  
  let allGoalsMet: string | false = false;
  const otherParameters: CMS69Parameter[] = [];

  parameters.forEach((param: any) => {
    const name = param.name;
    const value = parseParameterValue(param);
    
    const cms69Param: CMS69Parameter = {
      name,
      value,
      rawValue: param
    };
    
    allParameters.push(cms69Param);

    // Handle BMI observation resources first
    if (name === 'BMI During Measurement Period') {
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          param.resource.forEach((res: any) => {
            bmiObservations.push(processBMIObservation(res));
          });
        } else {
          bmiObservations.push(processBMIObservation(param.resource));
        }
      }
    } else if (name === 'Documented High BMI During Measurement Period') {
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          param.resource.forEach((res: any) => {
            documentedHighBMI.push(processBMIObservation(res));
          });
        } else {
          documentedHighBMI.push(processBMIObservation(param.resource));
        }
      }
    } else if (name === 'Documented Low BMI During Measurement Period') {
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          param.resource.forEach((res: any) => {
            documentedLowBMI.push(processBMIObservation(res));
          });
        } else {
          documentedLowBMI.push(processBMIObservation(param.resource));
        }
      }
    } else if (name === 'High BMI And Follow Up Provided') {
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          highBMIFollowUp.push(...param.resource);
        } else {
          highBMIFollowUp.push(param.resource);
        }
      }
    } else if (name === 'Low BMI And Follow Up Provided') {
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          lowBMIFollowUp.push(...param.resource);
        } else {
          lowBMIFollowUp.push(param.resource);
        }
      }
    } else if (name === 'High BMI Interventions Performed') {
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          highBMIInterventionsPerformed.push(...param.resource);
        } else {
          highBMIInterventionsPerformed.push(param.resource);
        }
      }
    } else if (name === 'Low BMI Interventions Performed') {
      if (value === 'resource' && param.resource) {
        if (Array.isArray(param.resource)) {
          lowBMIInterventionsPerformed.push(...param.resource);
        } else {
          lowBMIInterventionsPerformed.push(param.resource);
        }
      }
    } else if (name === 'All Goals Met') {
      if (typeof value === 'string') {
        allGoalsMet = value;
      }
    } else if (name === 'High BMI Follow Up Banner') {
      if (typeof value === 'string') {
        highBMIFollowUpBanner = value;
      }
    } else if (name === 'Low BMI Follow Up Banner') {
      if (typeof value === 'string') {
        lowBMIFollowUpBanner = value;
      }
    } else if (name === 'Needs Screening Banner') {
      if (typeof value === 'string') {
        needsScreeningBanner = value;
      }
    } else if (name === 'Denominator Exception Banner') {
      if (typeof value === 'string') {
        denominatorExceptionBanner = value;
      }
    } else if (name === 'BMI Exception Banner Text') {
      if (typeof value === 'string') {
        bmiExceptionBannerText = value;
      }
    } else if (name === 'BMI Not Done Category') {
      if (typeof value === 'string' && (value === 'Medical Reason' || value === 'Patient Reason' || value === 'Unknown Reason')) {
        bmiExceptionCategory = value as 'Medical Reason' | 'Patient Reason' | 'Unknown Reason';
      }
    } else if (name === 'BMI Not Done Reason Display') {
      if (typeof value === 'string') {
        bmiExceptionDetail = value;
      }
    } else if (name === 'BMI Follow-Up Exception Banner Text') {
      if (typeof value === 'string') {
        bmiFollowUpExceptionBannerText = value;
      }
    } else if (name === 'BMI Follow-Up Not Done Category') {
      if (typeof value === 'string' && (value === 'Medical Reason' || value === 'Patient Reason' || value === 'Unknown Reason')) {
        bmiFollowUpExceptionCategory = value as 'Medical Reason' | 'Patient Reason' | 'Unknown Reason';
      }
    } else if (name === 'BMI Follow-Up Not Done Reason Display') {
      if (typeof value === 'string') {
        bmiFollowUpExceptionDetail = value;
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
    } else if (name === 'Patient Score is 0') {
      if (typeof value === 'string') {
        specificActions.push(value);
      }
    } else if (name === 'Denominator Exclusions') {
      denominatorExclusions = value === 'empty-list' ? null : value as boolean | null;
    } else if (name === 'Denominator Exceptions') {
      denominatorExceptions = value === 'empty-list' ? null : value as boolean | null;
    } else if (name === 'Denominator') {
      denominator = value === 'empty-list' ? null : value as boolean | null;
    } else if (name === 'Numerator') {
      numerator = value === 'empty-list' ? null : value as boolean | null;
    } else if (name === 'Patient Score') {
      patientScore = value === 'empty-list' ? null : value as number | null;
    } else if (name === 'Has Normal BMI') {
      hasNormalBMI = value === 'empty-list' ? null : value as boolean | null;
    } else if (name === 'Is Pregnant During Day Of Measurement Period') {
      isPregnant = value === 'empty-list' ? null : value as boolean | null;
    } else if (value !== 'empty-list' && value !== null) {
      // Include non-null, non-empty parameters
      otherParameters.push(cms69Param);
    }
  });

  // Determine practitioner alert: Patient Score = 0 (eligible but no intervention)
  const practitionerAlert = patientScore === 0;

  return {
    practitionerAlert,
    initialPopulation,
    denominator,
    numerator,
    patientScore,
    denominatorExclusions,
    denominatorExceptions,
    ecqmExclusionReason,
    specificActions,
    bmiObservations: bmiObservations.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate)),
    hasNormalBMI,
    documentedHighBMI: documentedHighBMI.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate)),
    documentedLowBMI: documentedLowBMI.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate)),
    isPregnant,
    highBMIFollowUp,
    lowBMIFollowUp,
    highBMIInterventionsPerformed,
    lowBMIInterventionsPerformed,
    highBMIFollowUpBanner,
    lowBMIFollowUpBanner,
    needsScreeningBanner,
    denominatorExceptionBanner,
    bmiExceptionBannerText,
    bmiExceptionCategory,
    bmiExceptionDetail,
    bmiFollowUpExceptionBannerText,
    bmiFollowUpExceptionCategory,
    bmiFollowUpExceptionDetail,
    allGoalsMet,
    otherParameters,
    allParameters
  };
}

export function getBMICategory(bmi: number): { category: string; color: string; description: string } {
  if (bmi < 18.5) {
    return {
      category: 'Underweight',
      color: 'text-blue-800 bg-blue-100',
      description: 'BMI < 18.5'
    };
  } else if (bmi >= 18.5 && bmi < 25) {
    return {
      category: 'Normal',
      color: 'text-green-800 bg-green-100',
      description: 'BMI 18.5-24.9'
    };
  } else if (bmi >= 25 && bmi < 30) {
    return {
      category: 'Overweight',
      color: 'text-yellow-800 bg-yellow-100',
      description: 'BMI 25-29.9'
    };
  } else {
    return {
      category: 'Obese',
      color: 'text-red-800 bg-red-100',
      description: 'BMI ≥ 30'
    };
  }
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