// src/services/qualityAnalyticsClient.ts

export interface MeasureEvaluationOptions {
  period?: {
    start: string;
    end: string;
  };
  reportType?: "individual" | "summary" | "data-collection";
  includeClauseResults?: boolean;
}

export interface MeasureEvaluationResult {
  measureId: string;
  patientId: string;
  period: {
    start: string;
    end: string;
  };
  group: Array<{
    id: string;
    population: Array<{
      code: {
        coding: Array<{
          system: string;
          code: string;
          display: string;
        }>;
      };
      count: number;
    }>;
    measureScore?: {
      value: number;
    };
    clauseResults?: Array<{
      localId: string;
      final: any;
      raw?: any;
    }>;
  }>;
  evaluatedResource?: Array<{
    reference: string;
    type: string;
  }>;
}

export interface PopulationAnalysisResult {
  excluded: boolean;
  reasons?: Array<{
    statement: string;
    reason: string;
    priority?: "high" | "medium" | "low";
    category?: string;
    action?: string;
  }>;
  patientStatus?: {
    eligibleForMeasure: boolean;
    ageQualified: boolean;
    visitQualified: boolean;
    hasScreening: boolean;
    currentMeasureStatus:
      | "not_eligible"
      | "eligible_needs_screening"
      | "measure_complete"
      | "unknown";
  };
  recommendations?: Array<{
    priority: "high" | "medium" | "low";
    category: string;
    message: string;
    action: string;
    details?: Record<string, any>;
  }>;
  nextSteps?: Array<{
    step: number;
    priority: string;
    action: string;
    category: string;
  }>;
}

export class QualityAnalyticsClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3001/api") {
    // Changed to match your app.js routes
    this.baseUrl = baseUrl;
  }

  async evaluateMeasure(
    measureId: string,
    patientIds: string[],
    options?: MeasureEvaluationOptions
  ): Promise<MeasureEvaluationResult> {
    try {
      // Use your actual route structure
      const response = await fetch(`${this.baseUrl}/measures/${measureId}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientIds,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error evaluating measure:", error);
      throw error;
    }
  }

  async analyzePopulationExclusion(
    measureId: string,
    patientId: string
  ): Promise<PopulationAnalysisResult> {
    try {
      // This endpoint doesn't exist yet - use evaluate for now and transform the result
      const response = await fetch(`${this.baseUrl}/measures/${measureId}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientIds: [patientId],
          options: { includeClauseResults: true },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Transform the evaluate result into population analysis format
      return this.transformEvaluateToPopulationAnalysis(result, patientId);
    } catch (error) {
      console.error("Error analyzing population exclusion:", error);
      throw error;
    }
  }

  // In your qualityAnalyticsClient.generateClinicalGuidance method,
  // modify it to log the ELM data:

  // In your qualityAnalyticsClient.generateClinicalGuidance method,
  // modify it to log the ELM data:

  // In your qualityAnalyticsClient.generateClinicalGuidance method,
  // modify it to log the ELM data:

  // In your qualityAnalyticsClient.generateClinicalGuidance method,
  // modify it to log the ELM data:

  // In your qualityAnalyticsClient.generateClinicalGuidance method,
  // modify it to log the ELM data:

  async generateClinicalGuidance(
    measureId: string,
    patientId: string,
    clauseResults?: any[]
  ): Promise<PopulationAnalysisResult> {
    console.log("🔍 generateClinicalGuidance called with:", {
      measureId,
      patientId,
      clauseResultsLength: clauseResults?.length,
    });

    try {
      console.log("🔍 Making fetch request to:", `${this.baseUrl}/measures/${measureId}/evaluate`);

      const response = await fetch(`${this.baseUrl}/measures/${measureId}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientIds: [patientId],
          options: { includeClauseResults: true },
        }),
      });

      console.log("🔍 Response status:", response.status, response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("🔍 Response received, parsing...");

      // 🔍 TEST: Log the structure
      console.log("🔍 Full QAS Response Keys:", Object.keys(result));
      console.log("🔍 Has results array:", !!result.results);
      console.log("🔍 Results array length:", result.results?.length);
      console.log("🔍 Has elmDefinition:", !!result.elmDefinition);

      // Extract clause results from the first patient's results
      if (result.results?.[0]) {
        console.log("🔍 First result keys:", Object.keys(result.results[0]));
        console.log("🔍 Has detailedResults:", !!result.results[0].detailedResults);

        if (result.results[0].detailedResults?.[0]?.clauseResults) {
          const clauseResults = result.results[0].detailedResults[0].clauseResults;
          console.log("🔍 Found clause results:", clauseResults.length, "clauses");
          console.log("🔍 Sample clause result:", clauseResults[0]);

          // Count failed clauses
          const failedClauses = clauseResults.filter((clause: any) => clause.final === "FALSE");
          console.log("🔍 Failed clauses:", failedClauses.length, "out of", clauseResults.length);
        } else {
          console.log("🔍 No clauseResults found at results[0].detailedResults[0].clauseResults");
          if (result.results[0].detailedResults?.[0]) {
            console.log(
              "🔍 detailedResults[0] keys:",
              Object.keys(result.results[0].detailedResults[0])
            );
          }
        }
      }

      // Check ELM structure
      if (result.elmDefinition) {
        console.log("🔍 ELM Library ID:", result.elmDefinition?.library?.identifier?.id);
        console.log(
          "🔍 ELM Statements:",
          Object.keys(result.elmDefinition?.library?.statements?.def || {})
        );

        // Look for Initial Population statement
        const statements = result.elmDefinition?.library?.statements?.def || [];
        const initialPop = statements.find((stmt: any) => stmt.name === "Initial Population");
        if (initialPop) {
          console.log("🔍 Found Initial Population statement with localId:", initialPop.localId);
        }
      }

      // Transform the evaluate result into clinical guidance
      return this.transformEvaluateToClinicalGuidance(result, patientId, clauseResults);
    } catch (error) {
      console.error("Error generating clinical guidance:", error);
      throw error;
    }
  }
  // Helper method to transform evaluate results into population analysis
  private transformEvaluateToPopulationAnalysis(
    evaluateResult: any,
    patientId: string
  ): PopulationAnalysisResult {
    // Extract measure report for this patient
    const measureReport = evaluateResult; // Adjust based on your actual response structure

    // Check if patient is in initial population (denominator of group 1)
    const group1 = measureReport.group?.[0];
    const inDenominator =
      group1?.population?.find((p: any) => p.code?.coding?.[0]?.code === "denominator")?.count > 0;

    const excluded = !inDenominator;

    const reasons = [];
    const recommendations = [];
    const nextSteps = [];

    if (excluded) {
      reasons.push({
        statement: "Initial Population",
        reason: "Patient needs qualifying encounters during measurement period",
        priority: "high" as const,
        category: "visits",
        action: "Document office visit or preventive care visit",
      });

      recommendations.push({
        priority: "high" as const,
        category: "visits",
        message:
          "Patient needs either 2+ qualifying visits OR 1+ preventive visit during the measurement period.",
        action: "Document qualifying office visits or preventive care visits.",
      });

      nextSteps.push({
        step: 1,
        priority: "immediate",
        action: "Document qualifying office visits or preventive care visits.",
        category: "visits",
      });
    }

    return {
      excluded,
      reasons,
      patientStatus: {
        eligibleForMeasure: !excluded,
        ageQualified: true, // Assume true for now - you'd extract this from clause results
        visitQualified: !excluded,
        hasScreening: false, // Extract from numerator
        currentMeasureStatus: excluded ? "not_eligible" : "eligible_needs_screening",
      },
      recommendations,
      nextSteps,
    };
  }

  // Helper method for clinical guidance
  private transformEvaluateToClinicalGuidance(
    evaluateResult: any,
    patientId: string,
    clauseResults?: any[]
  ): PopulationAnalysisResult {
    // For now, use the same transformation as population analysis
    // In the future, this could do more sophisticated clause-level analysis
    return this.transformEvaluateToPopulationAnalysis(evaluateResult, patientId);
  }

  // Method to get data requirements for a measure
  async getDataRequirements(measureId: string) {
    try {
      // This endpoint doesn't exist yet
      const response = await fetch(`${this.baseUrl}/measures/${measureId}/data-requirements`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting data requirements:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const qualityAnalyticsClient = new QualityAnalyticsClient();
