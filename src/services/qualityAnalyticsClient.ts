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

      // Extract clause results and ELM
      const clauseResultsFromQAS = result.results?.[0]?.detailedResults?.[0]?.clauseResults || [];
      const elmDefinition = result.elmDefinition;

      console.log("🔍 Found clause results:", clauseResultsFromQAS.length, "clauses");
      console.log("🔍 Has elmDefinition:", !!elmDefinition);

      // 🚀 NEW: Use actionable gap analyzer instead of hard-coded logic
      if (clauseResultsFromQAS.length > 0 && elmDefinition) {
        console.log("🎯 Running actionable gap analysis...");

        // Get patient age from the QAS response
        const patientAge = this.extractPatientAge(result);

        const actionableInsight = this.analyzeActionableGaps(
          clauseResultsFromQAS,
          elmDefinition,
          patientAge
        );

        console.log("🎯 Actionable insight:", actionableInsight);

        // Transform to existing PopulationAnalysisResult format
        return this.transformActionableInsightToResult(actionableInsight);
      }

      // Fallback to existing logic
      return this.transformEvaluateToPopulationAnalysis(result, patientId);
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

  private extractPatientAge(qasResult: any): number {
    // Extract age from patient object in QAS response
    const patientObj = qasResult.results?.[0]?.patientObject;
    if (patientObj?.birthDate) {
      const birthDate = new Date(patientObj.birthDate);
      const today = new Date();
      return today.getFullYear() - birthDate.getFullYear();
    }
    return 70; // Default for minimal-test
  }

  private analyzeActionableGaps(
    clauseResults: any[],
    elmDefinition: any,
    patientAge: number
  ): ActionableInsight {
    console.log("🎯 Analyzing actionable gaps...");

    // Step 1: Filter out intrinsic blockers
    const intrinsicBlockers = this.checkIntrinsicBlockers(clauseResults, patientAge);
    if (intrinsicBlockers.length > 0) {
      return {
        category: "intrinsic",
        actionable: false,
        message: intrinsicBlockers[0].message,
        priority: "info",
      };
    }

    // Step 2: Focus on epistemological gaps (what Dr. User can fix)
    const epistemologicalGaps = this.analyzeEpistemologicalGaps(clauseResults, elmDefinition);

    return {
      category: "epistemological",
      actionable: true,
      gaps: epistemologicalGaps,
      priority: "high",
      recommendations: this.generateActionableRecommendations(epistemologicalGaps),
    };
  }

  private checkIntrinsicBlockers(clauseResults: any[], patientAge: number): any[] {
    const blockers = [];

    // Age blocker
    if (patientAge < 12) {
      blockers.push({
        type: "age",
        message: `Patient is ${patientAge} years old (measure requires ≥12 years)`,
        fixable: false,
      });
    }

    return blockers;
  }

  private analyzeEpistemologicalGaps(
    clauseResults: any[],
    elmDefinition: any
  ): EpistemologicalGap[] {
    const gaps: EpistemologicalGap[] = [];

    // Drill into visit requirements
    const visitGaps = this.drillIntoVisitRequirements(clauseResults, elmDefinition);
    gaps.push(...visitGaps);

    return gaps;
  }

  private drillIntoVisitRequirements(
    clauseResults: any[],
    elmDefinition: any
  ): EpistemologicalGap[] {
    console.log("🔍 Drilling into visit requirements...");

    const gaps: EpistemologicalGap[] = [];

    // Check Preventive Visits
    const preventiveGap = this.analyzePreventiveVisits(clauseResults, elmDefinition);
    if (preventiveGap) gaps.push(preventiveGap);

    // Check Qualifying Visits
    const qualifyingGap = this.analyzeQualifyingVisits(clauseResults, elmDefinition);
    if (qualifyingGap) gaps.push(qualifyingGap);

    return gaps;
  }

  private analyzePreventiveVisits(
    clauseResults: any[],
    elmDefinition: any
  ): EpistemologicalGap | null {
    const preventiveClauses = clauseResults.filter(
      (clause: any) => clause.statementName === "Preventive Visit During Measurement Period"
    );

    // Find the exists/count result for preventive visits
    const resultClause = preventiveClauses.find(
      (clause: any) => Array.isArray(clause.raw) && clause.raw.length === 0
    );

    if (resultClause) {
      return {
        type: "preventive_encounters",
        current: 0,
        required: 1,
        specificTypes: [
          "Annual Wellness Visit",
          "Preventive Care Services - Office Visit",
          "Preventive Care Services - Counseling",
          "Nutrition Services",
        ],
        timeframe: "during measurement period",
        fixStrategies: [
          "Document preventive care visit with appropriate CPT code",
          'Ensure encounter status is "finished"',
          "Verify encounter period falls within measurement period",
        ],
      };
    }

    return null;
  }

  private analyzeQualifyingVisits(
    clauseResults: any[],
    elmDefinition: any
  ): EpistemologicalGap | null {
    const qualifyingClauses = clauseResults.filter(
      (clause: any) => clause.statementName === "Qualifying Visit During Measurement Period"
    );

    // Find the count result
    const countClause = qualifyingClauses.find(
      (clause: any) => Array.isArray(clause.raw) && clause.raw.length === 0
    );

    if (countClause) {
      return {
        type: "office_encounters",
        current: 0,
        required: 2,
        specificTypes: [
          "Office Visit",
          "Telehealth/Virtual Encounter",
          "Physical Therapy Evaluation",
          "Occupational Therapy Evaluation",
        ],
        timeframe: "during measurement period",
        fixStrategies: [
          "Document 2 office visits with appropriate CPT codes",
          "Alternative: Document 1 preventive visit instead",
        ],
      };
    }

    return null;
  }

  private generateActionableRecommendations(gaps: EpistemologicalGap[]): string[] {
    const recommendations: string[] = [];

    for (const gap of gaps) {
      recommendations.push(...gap.fixStrategies);
    }

    return recommendations;
  }

  private transformActionableInsightToResult(insight: ActionableInsight): PopulationAnalysisResult {
    if (!insight.actionable) {
      // Intrinsic blocker
      return {
        excluded: true,
        reasons: [
          {
            statement: "Intrinsic Characteristic",
            reason: insight.message || "Patient characteristic prevents measure applicability",
            priority: "low" as const,
            category: "intrinsic",
            action: "No action required",
          },
        ],
        patientStatus: {
          eligibleForMeasure: false,
          ageQualified: true,
          visitQualified: false,
          hasScreening: false,
          currentMeasureStatus: "not_eligible",
        },
        recommendations: [],
        nextSteps: [],
      };
    }

    // Epistemological gaps - actionable!
    const recommendations =
      insight.gaps?.map((gap) => ({
        priority: "high" as const,
        category: gap.type,
        message: `Need ${gap.required - gap.current} ${gap.type.replace("_", " ")}`,
        action: gap.fixStrategies[0] || "Review documentation",
      })) || [];

    return {
      excluded: true,
      reasons:
        insight.gaps?.map((gap) => ({
          statement: gap.type,
          reason: `Missing ${gap.required - gap.current} ${gap.type.replace("_", " ")}`,
          priority: "high" as const,
          category: gap.type,
          action: gap.fixStrategies[0] || "Review documentation",
        })) || [],
      patientStatus: {
        eligibleForMeasure: false,
        ageQualified: true,
        visitQualified: false,
        hasScreening: false,
        currentMeasureStatus: "eligible_needs_screening",
      },
      recommendations,
      nextSteps:
        insight.recommendations?.map((rec, index) => ({
          step: index + 1,
          priority: "immediate",
          action: rec,
          category: "encounters",
        })) || [],
    };
  }
}

interface EpistemologicalGap {
  type: 'preventive_encounters' | 'office_encounters';
  current: number;
  required: number;
  specificTypes: string[];
  timeframe: string;
  fixStrategies: string[];
}

interface ActionableInsight {
  category: 'intrinsic' | 'epistemological';
  actionable: boolean;
  message?: string;
  gaps?: EpistemologicalGap[];
  priority: 'high' | 'medium' | 'low' | 'info';
  recommendations?: string[];
}

// Create and export a singleton instance
export const qualityAnalyticsClient = new QualityAnalyticsClient();
