// src/services/enhancedGuidanceService.ts

import type { MeasureReport, Patient } from "../types/fhir";
import { qualityAnalyticsClient } from "./qualityAnalyticsClient";
import { getCMS138Guidance } from "../utils/measureCQLLogic"; // Fallback

export interface EnhancedGuidanceResult {
  // Patient context
  patientName: string;
  patientAge: number;

  // Enhanced analysis
  isEnhanced: boolean;
  status: "not_eligible" | "eligible_needs_screening" | "measure_complete" | "unknown";

  // Specific gaps with current vs required values
  specificIssues: Array<{
    category: "age" | "encounters" | "screening" | "intervention";
    issue: string;
    currentValue: string | number;
    requiredValue: string | number;
    priority: "high" | "medium" | "low";
    actionable: boolean;
  }>;

  // Actionable recommendations
  recommendations: Array<{
    action: string;
    reason: string;
    buttonText: string;
    actionType: "create_encounter" | "document_screening" | "schedule_followup" | "info";
    priority: "immediate" | "soon" | "routine";
  }>;

  // Fallback guidance (for comparison/backup)
  fallbackGuidance: {
    message: string;
    action?: string;
    priority: "info" | "warning" | "action";
  };
}

export class EnhancedGuidanceService {
  /**
   * Generate enhanced guidance by combining MeasureReport with clause-level analysis
   */
  async generateGuidance(
    measureId: string,
    patientId: string,
    measureReport: MeasureReport,
    patient: Patient
  ): Promise<EnhancedGuidanceResult> {
    console.log("🔧 Enhanced Guidance - Starting:", { measureId, patientId });

    // Always generate fallback guidance first (safety net)
    const fallbackGuidance = getCMS138Guidance(measureReport, patient);

    // Extract patient context
    const patientName = this.getPatientDisplayName(patient);
    const patientAge = this.calculateAge(patient.birthDate);

    try {
      console.log("🔧 Calling quality analytics service for detailed analysis...");

      // Always call quality analytics service to get clause results
      // (MeasureReport doesn't contain clause results - we need detailed calculation)
      const detailedAnalysis = await qualityAnalyticsClient.generateClinicalGuidance(
        measureId,
        patientId,
        [] // Pass empty array since we'll get clause results from QAS
      );

      console.log("🔧 Got detailedAnalysis back:", detailedAnalysis);

      // Transform into UI-friendly format
      return this.transformToEnhancedGuidance(
        detailedAnalysis,
        patientName,
        patientAge,
        fallbackGuidance,
        [] // Will get actual clause results from detailedAnalysis
      );
    } catch (error) {
      console.warn("🔧 Enhanced analysis failed, using fallback:", error);
    }

    // Enhanced analysis not available - use fallback with patient context
    console.log("🔧 Using fallback guidance");
    return this.createFallbackGuidance(patientName, patientAge, fallbackGuidance, measureReport);
  }
  /**
   * Extract clause results from MeasureReport if available
   */
  private extractClauseResults(measureReport: MeasureReport): any[] {
    // Look for clause results in the measure report groups
    const clauseResults: any[] = [];

    measureReport.group?.forEach((group) => {
      if ((group as any).clauseResults) {
        clauseResults.push(...(group as any).clauseResults);
      }
    });

    return clauseResults;
  }

  /**
   * Transform detailed analysis into enhanced guidance format
   */
  private transformToEnhancedGuidance(
    analysis: any,
    patientName: string,
    patientAge: number,
    fallbackGuidance: any,
    clauseResults: any[]
  ): EnhancedGuidanceResult {
    const specificIssues = [];
    const recommendations = [];

    // Analyze age requirement
    if (analysis.patientStatus?.ageQualified === false) {
      specificIssues.push({
        category: "age" as const,
        issue: "Patient below minimum age",
        currentValue: `${patientAge} years`,
        requiredValue: "≥12 years",
        priority: "low" as const,
        actionable: false,
      });
    }

    // Analyze encounter requirements
    if (analysis.patientStatus?.visitQualified === false) {
      const visitCount = this.extractVisitCountFromClauseResults(clauseResults);
      const preventiveVisitExists = this.extractPreventiveVisitFromClauseResults(clauseResults);

      specificIssues.push({
        category: "encounters" as const,
        issue: "Insufficient qualifying encounters",
        currentValue: `${visitCount} visits${
          preventiveVisitExists ? ", 1 preventive" : ", 0 preventive"
        }`,
        requiredValue: "2+ office visits OR 1+ preventive visit",
        priority: "high" as const,
        actionable: true,
      });

      recommendations.push({
        action: `Document ${
          visitCount === 1 ? "one more office visit" : "office visits"
        } or a preventive care visit`,
        reason: `${patientName} needs either 2+ qualifying visits OR 1+ preventive visit during measurement period`,
        buttonText: "+ Create Encounter",
        actionType: "create_encounter" as const,
        priority: "immediate" as const,
      });
    }

    // Analyze screening requirements
    if (
      analysis.patientStatus?.hasScreening === false &&
      analysis.patientStatus?.visitQualified === true
    ) {
      specificIssues.push({
        category: "screening" as const,
        issue: "Tobacco screening not documented",
        currentValue: "No screening documented",
        requiredValue: "Tobacco use status documented",
        priority: "high" as const,
        actionable: true,
      });

      recommendations.push({
        action: "Document tobacco/smoking status using standardized codes",
        reason: `${patientName} qualifies for measure but tobacco screening is missing`,
        buttonText: "+ Document Smoking Status",
        actionType: "document_screening" as const,
        priority: "immediate" as const,
      });
    }

    return {
      patientName,
      patientAge,
      isEnhanced: true,
      status: analysis.patientStatus?.currentMeasureStatus || "unknown",
      specificIssues,
      recommendations,
      fallbackGuidance,
    };
  }

  /**
   * Create fallback guidance with patient context
   */
  private createFallbackGuidance(
    patientName: string,
    patientAge: number,
    fallbackGuidance: any,
    measureReport: MeasureReport
  ): EnhancedGuidanceResult {
    const recommendations = [];
    const specificIssues = [];

    // Add patient context to fallback guidance
    if (fallbackGuidance.action) {
      if (fallbackGuidance.action.includes("encounter")) {
        recommendations.push({
          action: fallbackGuidance.action,
          reason: `${patientName} (${patientAge} years old) needs qualifying encounters during the measurement period`,
          buttonText: "+ Create Encounter",
          actionType: "create_encounter" as const,
          priority: "immediate" as const,
        });

        specificIssues.push({
          category: "encounters" as const,
          issue: "Missing qualifying encounters",
          currentValue: "0 encounters",
          requiredValue: "2+ office visits OR 1+ preventive visit",
          priority: "high" as const,
          actionable: true,
        });
      } else if (fallbackGuidance.action.includes("tobacco")) {
        recommendations.push({
          action: fallbackGuidance.action,
          reason: `${patientName} (${patientAge} years old) needs tobacco screening documented`,
          buttonText: "+ Document Smoking Status",
          actionType: "document_screening" as const,
          priority: "immediate" as const,
        });

        specificIssues.push({
          category: "screening" as const,
          issue: "Tobacco screening missing",
          currentValue: "Not documented",
          requiredValue: "Tobacco use status documented",
          priority: "high" as const,
          actionable: true,
        });
      }
    }

    return {
      patientName,
      patientAge,
      isEnhanced: false,
      status: fallbackGuidance.priority === "action" ? "not_eligible" : "measure_complete",
      specificIssues,
      recommendations,
      fallbackGuidance,
    };
  }

  // Helper methods
  private extractVisitCountFromClauseResults(clauseResults: any[]): number {
    // Look for Count() clause that represents qualifying visits
    const countClause = clauseResults.find(
      (clause) => clause.localId && typeof clause.final === "number" && clause.final >= 0
    );

    return countClause?.final || 0;
  }

  private extractPreventiveVisitFromClauseResults(clauseResults: any[]): boolean {
    // Look for exists() clause that represents preventive visits
    const existsClause = clauseResults.find(
      (clause) => clause.localId && typeof clause.final === "boolean"
    );

    return existsClause?.final || false;
  }

  private getPatientDisplayName(patient: Patient): string {
    const name = patient.name?.[0];
    if (!name) return "Unknown Patient";

    const given = name.given?.join(" ") || "";
    const family = name.family || "";

    return `${given} ${family}`.trim() || "Unknown Patient";
  }

  private calculateAge(birthDate?: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}

// Export singleton instance
export const enhancedGuidanceService = new EnhancedGuidanceService();
