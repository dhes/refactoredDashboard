// src/utils/bmiObservationCreation.ts
import { fhirClient } from '../services/fhirClient';

export interface BMIFormData {
  date: string;
  time?: string;
  height: number;
  heightUnit: 'inches' | 'cm';
  weight: number;
  weightUnit: 'lbs' | 'kg';
}

export interface BMICalculationResult {
  bmi: number;
  category: string;
  categoryColor: string;
}

/**
 * Convert height to centimeters
 */
export const convertHeightToCm = (value: number, unit: 'inches' | 'cm'): number => {
  return unit === 'inches' ? value * 2.54 : value;
};

/**
 * Convert weight to kilograms
 */
export const convertWeightToKg = (value: number, unit: 'lbs' | 'kg'): number => {
  return unit === 'lbs' ? value * 0.453592 : value;
};

/**
 * Calculate BMI from height (cm) and weight (kg)
 */
export const calculateBMI = (heightCm: number, weightKg: number): number => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

/**
 * Get BMI category and color coding
 */
export const getBMICategory = (bmi: number): BMICalculationResult => {
  if (bmi < 18.5) {
    return {
      bmi,
      category: 'Underweight',
      categoryColor: 'text-blue-800 bg-blue-100'
    };
  } else if (bmi >= 18.5 && bmi < 25) {
    return {
      bmi,
      category: 'Normal',
      categoryColor: 'text-green-800 bg-green-100'
    };
  } else if (bmi >= 25 && bmi < 30) {
    return {
      bmi,
      category: 'Overweight',
      categoryColor: 'text-yellow-800 bg-yellow-100'
    };
  } else {
    return {
      bmi,
      category: 'Obese',
      categoryColor: 'text-red-800 bg-red-100'
    };
  }
};

/**
 * Create height observation (LOINC 8302-2)
 */
const createHeightObservation = (
  patientId: string,
  heightCm: number,
  dateTime: string
) => ({
  resourceType: "Observation" as const,
  meta: {
    profile: ["http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-observation"]
  },
  status: "final" as const,
  category: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: "vital-signs",
          display: "Vital Signs"
        }
      ]
    }
  ],
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "8302-2",
        display: "Body height",
        userSelected: true
      }
    ]
  },
  subject: {
    reference: `Patient/${patientId}`
  },
  effectiveDateTime: dateTime,
  valueQuantity: {
    value: Math.round(heightCm * 10) / 10, // Round to 1 decimal
    unit: "cm",
    system: "http://unitsofmeasure.org",
    code: "cm"
  }
});

/**
 * Create weight observation (LOINC 29463-7)
 */
const createWeightObservation = (
  patientId: string,
  weightKg: number,
  dateTime: string
) => ({
  resourceType: "Observation" as const,
  meta: {
    profile: ["http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-observation"]
  },
  status: "final" as const,
  category: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: "vital-signs",
          display: "Vital Signs"
        }
      ]
    }
  ],
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "29463-7",
        display: "Body weight",
        userSelected: true
      }
    ]
  },
  subject: {
    reference: `Patient/${patientId}`
  },
  effectiveDateTime: dateTime,
  valueQuantity: {
    value: Math.round(weightKg * 10) / 10, // Round to 1 decimal
    unit: "kg",
    system: "http://unitsofmeasure.org",
    code: "kg"
  }
});

/**
 * Create BMI observation (LOINC 39156-5) - What CMS69 looks for
 */
const createBMIObservation = (
  patientId: string,
  bmi: number,
  dateTime: string
) => ({
  resourceType: "Observation" as const,
  meta: {
    profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-bmi"]
  },
  status: "final" as const,
  category: [
    {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: "vital-signs",
          display: "Vital Signs"
        }
      ]
    }
  ],
  code: {
    coding: [
      {
        system: "http://loinc.org",
        code: "39156-5",
        display: "Body mass index (BMI) [Ratio]",
        userSelected: true
      }
    ]
  },
  subject: {
    reference: `Patient/${patientId}`
  },
  effectiveDateTime: dateTime,
  valueQuantity: {
    value: Math.round(bmi * 10) / 10, // Round to 1 decimal
    unit: "kg/m2",
    system: "http://unitsofmeasure.org",
    code: "kg/m2"
  }
});

/**
 * Creates all three BMI-related observations (height, weight, BMI)
 */
export const createBMIObservations = async (
  patientId: string,
  formData: BMIFormData
): Promise<{ height: any; weight: any; bmi: any }> => {
  // Parse time or use default
  const timeString = formData.time || new Date().toTimeString().slice(0, 5);
  const [hours, minutes] = timeString.split(':');

  const dateTime = `${formData.date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00.000Z`;

  // Convert to metric
  const heightCm = convertHeightToCm(formData.height, formData.heightUnit);
  const weightKg = convertWeightToKg(formData.weight, formData.weightUnit);
  const bmi = calculateBMI(heightCm, weightKg);

  // Create all three observations
  const heightObs = createHeightObservation(patientId, heightCm, dateTime);
  const weightObs = createWeightObservation(patientId, weightKg, dateTime);
  const bmiObs = createBMIObservation(patientId, bmi, dateTime);

  try {
    // Create all observations in parallel
    const [heightResult, weightResult, bmiResult] = await Promise.all([
      fhirClient.createObservation(heightObs),
      fhirClient.createObservation(weightObs),
      fhirClient.createObservation(bmiObs)
    ]);

    console.log('BMI observations created successfully', {
      height: heightResult,
      weight: weightResult,
      bmi: bmiResult
    });

    return {
      height: heightResult,
      weight: weightResult,
      bmi: bmiResult
    };
  } catch (error) {
    console.error('Failed to create BMI observations:', error);
    throw error;
  }
};

/**
 * Validates BMI form data
 */
export const validateBMIForm = (formData: Partial<BMIFormData>): string[] => {
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

  if (!formData.height || formData.height <= 0) {
    errors.push('Height is required and must be greater than 0');
  } else {
    const unit = formData.heightUnit || 'inches';
    if (unit === 'inches' && (formData.height < 48 || formData.height > 96)) {
      errors.push('Height must be between 48 and 96 inches');
    } else if (unit === 'cm' && (formData.height < 122 || formData.height > 244)) {
      errors.push('Height must be between 122 and 244 cm');
    }
  }

  if (!formData.weight || formData.weight <= 0) {
    errors.push('Weight is required and must be greater than 0');
  } else {
    const unit = formData.weightUnit || 'lbs';
    if (unit === 'lbs' && (formData.weight < 80 || formData.weight > 500)) {
      errors.push('Weight must be between 80 and 500 lbs');
    } else if (unit === 'kg' && (formData.weight < 36 || formData.weight > 227)) {
      errors.push('Weight must be between 36 and 227 kg');
    }
  }

  return errors;
};