// src/services/fhirClient.ts
import {
  type Patient,
  type Observation,
  type Encounter,
  type Bundle,
  type OperationOutcome,
  type Procedure,
} from "../types/fhir";

// Import functions separately (they're not types)
import { createMinimalEncounter, createSmokingStatusObservation } from "../types/fhir";

// Import AllergyIntolerance directly from fhir/r4
import type {
  AllergyIntolerance,
  Condition,
  MedicationStatement,
  MedicationRequest,
  ServiceRequest,
  FamilyMemberHistory,
  Immunization,
} from "fhir/r4";

// Configuration - adjust to match your server
// const FHIR_SERVER = 'http://localhost:8080/fhir'; // Update this to match your HAPI server
// const FHIR_SERVER = "https://enhanced.hopena.info/fhir"; // Direct (CORS issues)
const FHIR_SERVER = "/fhir"; // Proxied through Vite dev server

// Generic FHIR fetch function (based on your existing implementation)
async function fetchFHIR<T>(resourceType: string, searchParams: string): Promise<T[]> {
  const res = await fetch(`${FHIR_SERVER}/${resourceType}?${searchParams}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${resourceType}: ${res.statusText}`);
  }
  const bundle = (await res.json()) as Bundle;
  console.log(`Fetched ${resourceType}:`, bundle);
  return bundle.entry?.map((e: any) => e.resource as T) || [];
}

// Create a new FHIR resource
async function createFHIR<T>(resource: T): Promise<T> {
  const res = await fetch(`${FHIR_SERVER}/${(resource as any).resourceType}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/fhir+json",
    },
    body: JSON.stringify(resource),
  });

  if (!res.ok) {
    const error = (await res.json()) as OperationOutcome;
    throw new Error(
      `Failed to create ${(resource as any).resourceType}: ${
        error.issue?.[0]?.diagnostics || res.statusText
      }`
    );
  }

  return res.json();
}

// Update an existing FHIR resource
async function updateFHIR<T>(resource: T & { id: string }): Promise<T> {
  const res = await fetch(`${FHIR_SERVER}/${(resource as any).resourceType}/${resource.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/fhir+json",
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
    return fetchFHIR<Procedure>("Procedure", `patient=Patient/${patientId}`);
  }

  async createProcedure(procedure: Procedure): Promise<Procedure> {
    return createFHIR(procedure);
  }

  // Immunization operations
  async getImmunizations(patientId: string): Promise<Immunization[]> {
    return fetchFHIR<Immunization>("Immunization", `patient=Patient/${patientId}`);
  }

  // FamilyMemberHistory operations
  async getFamilyHistory(patientId: string): Promise<FamilyMemberHistory[]> {
    return fetchFHIR<FamilyMemberHistory>("FamilyMemberHistory", `patient=Patient/${patientId}`);
  }
  // MedicationStatement operations
  async getMedications(patientId: string): Promise<MedicationStatement[]> {
    return fetchFHIR<MedicationStatement>("MedicationStatement", `patient=Patient/${patientId}`);
  }

  // MedicationRequest operations
  async getMedicationRequests(patientId: string): Promise<MedicationRequest[]> {
    return fetchFHIR<MedicationRequest>("MedicationRequest", `patient=Patient/${patientId}`);
  }

  async createMedicationRequest(medicationRequest: MedicationRequest): Promise<MedicationRequest> {
    return createFHIR(medicationRequest);
  }

  // ServiceRequest operations
  async getServiceRequests(patientId: string): Promise<ServiceRequest[]> {
    return fetchFHIR<ServiceRequest>("ServiceRequest", `patient=Patient/${patientId}`);
  }

  async createServiceRequest(serviceRequest: ServiceRequest): Promise<ServiceRequest> {
    return createFHIR(serviceRequest);
  }

  // AllergyIntolerance operations
  async getAllergies(patientId: string): Promise<AllergyIntolerance[]> {
    return fetchFHIR<AllergyIntolerance>("AllergyIntolerance", `patient=Patient/${patientId}`);
  }

  async getConditions(patientId: string): Promise<Condition[]> {
    return fetchFHIR<Condition>("Condition", `patient=Patient/${patientId}`);
  }

  async createCondition(condition: Condition): Promise<Condition> {
    return createFHIR(condition);
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
    const results = await fetchFHIR<Patient>("Patient", `_id=${id}`);
    return results[0] || null;
  }

  async searchPatients(searchParams: string = ""): Promise<Patient[]> {
    return fetchFHIR<Patient>("Patient", searchParams);
  }


  // Encounter operations
  async getEncounters(patientId: string): Promise<Encounter[]> {
    return fetchFHIR<Encounter>("Encounter", `patient=Patient/${patientId}`);
  }

  async createEncounter(encounter: Encounter): Promise<Encounter> {
    return createFHIR(encounter);
  }

  async createOfficeVisit(patientId: string, date?: string): Promise<Encounter> {
    const encounter = createMinimalEncounter(patientId, date);
    return this.createEncounter(encounter);
  }

  // Observation operations
  async getObservations(
    patientId: string,
    code?: string,
    category?: string
  ): Promise<Observation[]> {
    let searchParams = `patient=Patient/${patientId}`;
    if (code) {
      searchParams += `&code=${encodeURIComponent(code)}`;
    }
    if (category) {
      searchParams += `&category=${encodeURIComponent(category)}`;
    }
    return fetchFHIR<Observation>("Observation", searchParams);
  }

  async getSmokingStatus(patientId: string): Promise<{latest: Observation | null, all: Observation[]}> {
    // All LOINC codes for tobacco smoking status
    const smokingStatusCodes = [
      "http://loinc.org|72166-2", // Tobacco smoking status
      "http://loinc.org|39240-7", // Tobacco use screening
      "http://loinc.org|68535-4", // Tobacco use status
      "http://loinc.org|68536-2", // Tobacco use assessment
    ];

    // Get observations for all codes
    const allObservations = await Promise.all(
      smokingStatusCodes.map((code) => this.getObservations(patientId, code))
    );

    // Flatten the results and sort by date
    const flattenedObservations = allObservations.flat();
    const sortedObservations = flattenedObservations.sort((a, b) => {
      const dateA = a.effectiveDateTime || a.effectivePeriod?.start || "";
      const dateB = b.effectiveDateTime || b.effectivePeriod?.start || "";
      return dateB.localeCompare(dateA);
    });

    return {
      latest: sortedObservations[0] || null,
      all: sortedObservations
    };
  }

  async createObservation(observation: Observation): Promise<Observation> {
    return createFHIR(observation);
  }

  async recordSmokingStatus(
    patientId: string,
    status: "NEVER_SMOKER" | "FORMER_SMOKER" | "CURRENT_SMOKER" | "UNKNOWN",
    encounterId?: string
  ): Promise<Observation> {
    const observation = createSmokingStatusObservation(patientId, status, encounterId);
    return this.createObservation(observation);
  }

  // Library operations
  async evaluateLibrary(
    libraryId: string,
    patientId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<any> {
    const url = `${FHIR_SERVER}/Library/${libraryId}/$evaluate`;
    
    const requestBody = {
      resourceType: "Parameters",
      parameter: [
        {
          name: "subject",
          valueString: `Patient/${patientId}`
        },
        {
          name: "parameters",
          resource: {
            resourceType: "Parameters",
            parameter: [
              {
                name: "Measurement Period",
                valuePeriod: {
                  start: periodStart,
                  end: periodEnd
                }
              }
            ]
          }
        }
      ]
    };

    const res = await fetch(url, { 
      method: "POST",
      headers: {
        "Content-Type": "application/fhir+json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      throw new Error(`Failed to evaluate library: ${res.statusText}`);
    }

    return res.json();
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
    const [patient, encounters, observations] = await Promise.all([
      this.getPatient(patientId),
      this.getEncounters(patientId),
      this.getObservations(patientId),
    ]);

    return {
      patient,
      encounters,
      observations,
      // Add computed properties
      hasRecentEncounter: encounters.some((e) => {
        const encounterDate = new Date(e.period?.start || "");
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return encounterDate > oneYearAgo;
      }),
      hasSmokingStatus: observations.some((o) =>
        o.code.coding?.some((c) => c.code === "72166-2" && c.system === "http://loinc.org")
      ),
    };
  }
}

// Export a singleton instance
export const fhirClient = new FHIRClient();

// Also export the generic functions if needed elsewhere
export { fetchFHIR, createFHIR, updateFHIR, FHIR_SERVER };
