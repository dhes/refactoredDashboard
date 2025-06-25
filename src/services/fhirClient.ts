// src/services/fhirClient.ts
import { 
  type Patient, 
  type MeasureReport, 
  type Observation, 
  type Encounter,
  type Bundle,
  type OperationOutcome,
  type Procedure,
} from '../types/fhir';

// Import functions separately (they're not types)
import {
  createMinimalEncounter,
  createSmokingStatusObservation,
} from '../types/fhir';

// Import AllergyIntolerance directly from fhir/r4
import type { AllergyIntolerance, Condition, MedicationStatement, FamilyMemberHistory, Immunization } from 'fhir/r4';

// Configuration - adjust to match your server
const FHIR_SERVER = 'http://localhost:8080/fhir'; // Update this to match your HAPI server

// Generic FHIR fetch function (based on your existing implementation)
async function fetchFHIR<T>(resourceType: string, searchParams: string): Promise<T[]> {
  const res = await fetch(`${FHIR_SERVER}/${resourceType}?${searchParams}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${resourceType}: ${res.statusText}`);
  }
  const bundle = await res.json() as Bundle;
  console.log(`Fetched ${resourceType}:`, bundle);
  return bundle.entry?.map((e: any) => e.resource as T) || [];
}

// Create a new FHIR resource
async function createFHIR<T>(resource: T): Promise<T> {
  const res = await fetch(`${FHIR_SERVER}/${(resource as any).resourceType}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/fhir+json',
    },
    body: JSON.stringify(resource),
  });
  
  if (!res.ok) {
    const error = await res.json() as OperationOutcome;
    throw new Error(`Failed to create ${(resource as any).resourceType}: ${error.issue?.[0]?.diagnostics || res.statusText}`);
  }
  
  return res.json();
}

// Update an existing FHIR resource
async function updateFHIR<T>(resource: T & { id: string }): Promise<T> {
  const res = await fetch(`${FHIR_SERVER}/${(resource as any).resourceType}/${resource.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/fhir+json',
    },
    body: JSON.stringify(resource),
  });
  
  if (!res.ok) {
    throw new Error(`Failed to update ${(resource as any).resourceType}: ${res.statusText}`);
  }
  
  return res.json();
}

// FHIR Client class with all your operations

class FHIRClient {

// Procedure operations
async getProcedures(patientId: string): Promise<Procedure[]> {
  return fetchFHIR<Procedure>('Procedure', `patient=Patient/${patientId}`);
}

// Immunization operations
async getImmunizations(patientId: string): Promise<Immunization[]> {
  return fetchFHIR<Immunization>('Immunization', `patient=Patient/${patientId}`);
}

// FamilyMemberHistory operations
async getFamilyHistory(patientId: string): Promise<FamilyMemberHistory[]> {
  return fetchFHIR<FamilyMemberHistory>('FamilyMemberHistory', `patient=Patient/${patientId}`);
}
  // MedicationStatement operations
async getMedications(patientId: string): Promise<MedicationStatement[]> {
  return fetchFHIR<MedicationStatement>('MedicationStatement', `patient=Patient/${patientId}`);
}

  // AllergyIntolerance operations
  async getAllergies(patientId: string): Promise<AllergyIntolerance[]> {
    return fetchFHIR<AllergyIntolerance>('AllergyIntolerance', `patient=Patient/${patientId}`);
  }

async getConditions(patientId: string): Promise<Condition[]> {
  return fetchFHIR<Condition>('Condition', `patient=Patient/${patientId}`);
}
  // You might also want to add these related methods:
  async createAllergy(allergy: AllergyIntolerance): Promise<AllergyIntolerance> {
    return createFHIR(allergy);
  }

  async updateAllergy(allergy: AllergyIntolerance & { id: string }): Promise<AllergyIntolerance> {
    return updateFHIR(allergy);
  }
  // Patient operations
  async getPatient(id: string): Promise<Patient | null> {
    const results = await fetchFHIR<Patient>('Patient', `_id=${id}`);
    return results[0] || null;
  }

  async searchPatients(searchParams: string = ''): Promise<Patient[]> {
    return fetchFHIR<Patient>('Patient', searchParams);
  }

  // MeasureReport operations
  async getMeasureReports(patientId: string): Promise<MeasureReport[]> {
    return fetchFHIR<MeasureReport>('MeasureReport', `patient=Patient/${patientId}`);
  }

  async evaluateMeasure(measureId: string, patientId: string, periodStart: string, periodEnd: string): Promise<MeasureReport> {
    const url = `${FHIR_SERVER}/Measure/${measureId}/$evaluate-measure?patient=Patient/${patientId}&periodStart=${periodStart}&periodEnd=${periodEnd}`;
    const res = await fetch(url, { method: 'POST' });
    
    if (!res.ok) {
      throw new Error(`Failed to evaluate measure: ${res.statusText}`);
    }
    
    return res.json();
  }

  // Encounter operations
  async getEncounters(patientId: string): Promise<Encounter[]> {
    return fetchFHIR<Encounter>('Encounter', `patient=Patient/${patientId}`);
  }

  async createEncounter(encounter: Encounter): Promise<Encounter> {
    return createFHIR(encounter);
  }

  async createOfficeVisit(patientId: string, date?: string): Promise<Encounter> {
    const encounter = createMinimalEncounter(patientId, date);
    return this.createEncounter(encounter);
  }

  // Observation operations
async getObservations(patientId: string, code?: string, category?: string): Promise<Observation[]> {
  let searchParams = `patient=Patient/${patientId}`;
  if (code) {
    searchParams += `&code=${encodeURIComponent(code)}`;
  }
  if (category) {
    searchParams += `&category=${encodeURIComponent(category)}`;
  }
  return fetchFHIR<Observation>('Observation', searchParams);
}

  async getSmokingStatus(patientId: string): Promise<Observation | null> {
    // LOINC code for tobacco smoking status
    const observations = await this.getObservations(patientId, 'http://loinc.org|72166-2');
    // Return the most recent one
    return observations.sort((a, b) => {
      const dateA = a.effectiveDateTime || a.effectivePeriod?.start || '';
      const dateB = b.effectiveDateTime || b.effectivePeriod?.start || '';
      return dateB.localeCompare(dateA);
    })[0] || null;
  }

  async createObservation(observation: Observation): Promise<Observation> {
    return createFHIR(observation);
  }

  async recordSmokingStatus(
    patientId: string, 
    status: 'NEVER_SMOKER' | 'FORMER_SMOKER' | 'CURRENT_SMOKER' | 'UNKNOWN',
    encounterId?: string
  ): Promise<Observation> {
    const observation = createSmokingStatusObservation(patientId, status, encounterId);
    return this.createObservation(observation);
  }

  // Bundle operations for efficient fetching
  async getPatientEverything(patientId: string): Promise<Bundle> {
    const res = await fetch(`${FHIR_SERVER}/Patient/${patientId}/$everything`);
    if (!res.ok) {
      throw new Error(`Failed to fetch patient everything: ${res.statusText}`);
    }
    return res.json();
  }

  // Utility method to get multiple resource types at once
  async getPatientSummary(patientId: string) {
    const [patient, encounters, observations, measureReports] = await Promise.all([
      this.getPatient(patientId),
      this.getEncounters(patientId),
      this.getObservations(patientId),
      this.getMeasureReports(patientId)
    ]);

    return {
      patient,
      encounters,
      observations,
      measureReports,
      // Add computed properties
      hasRecentEncounter: encounters.some(e => {
        const encounterDate = new Date(e.period?.start || '');
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return encounterDate > oneYearAgo;
      }),
      hasSmokingStatus: observations.some(o => 
        o.code.coding?.some(c => c.code === '72166-2' && c.system === 'http://loinc.org')
      )
    };
  }
}

// Export a singleton instance
export const fhirClient = new FHIRClient();

// Also export the generic functions if needed elsewhere
export { fetchFHIR, createFHIR, updateFHIR, FHIR_SERVER };