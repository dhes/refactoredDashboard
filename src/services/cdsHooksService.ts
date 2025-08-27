// src/services/cdsHooksService.ts

/* Reverse proxy setup is tricky because HAPI allows CORS for /fhir 
but not for cds-services. */

export interface CDSHookCard {
  summary: string;
  detail?: string;
  source?: {
    label: string;
    url?: string;
  };
  selectionBehavior?: string;
  links?: Array<{
    label: string;
    url: string;
    type?: string;
  }>;
  suggestions?: Array<{
    label: string;
    actions?: Array<any>;
  }>;
}

export interface CDSResponse {
  cards: CDSHookCard[];
}

export interface CDSRequest {
  hookInstance: string;
  fhirServer: string;
  hook: string;
  context: {
    patientId: string;
    userId: string;
  };
  prefetch: Record<string, any>;
}

class CDSHooksService {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  async getTobaccoRecommendations(patientId: string): Promise<CDSResponse> {
    const request: CDSRequest = {
      hookInstance: `patient-view-${patientId}-${Date.now()}`,
      fhirServer: `http://localhost:8080/fhir`, // Keep this absolute for the backend
      hook: "patient-view",
      context: {
        patientId,
        userId: "Practitioner/example",
      },
      prefetch: {},
    };

    const url = `${this.baseUrl}/cds-services/TobaccoRecommendation`;
    console.log("CDS Hooks URL being used:", url);
    console.log("FHIR Server URL in request:", request.fhirServer);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      console.log("CDS Hooks response:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });

      if (!response.ok) {
        throw new Error(`CDS Hooks request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("CDS Hooks data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching CDS Hooks recommendations:", error);
      throw error;
    }
  }
}

export const cdsHooksService = new CDSHooksService();
