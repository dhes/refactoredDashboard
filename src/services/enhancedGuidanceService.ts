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
 * UPDATED: Transform detailed analysis into enhanced guidance format
 * Now properly extracts values from Clinical Interpreter's structured data
 */
private transformToEnhancedGuidance(
  analysis: any,
  patientName: string,
  patientAge: number,
  fallbackGuidance: any,
  clauseResults: any[]
): EnhancedGuidanceResult {
  
  type SpecificIssue = {
    category: "age" | "encounters" | "screening" | "intervention";
    issue: string;
    currentValue: string | number;
    requiredValue: string | number;
    priority: "high" | "medium" | "low";
    actionable: boolean;
  };

  type Recommendation = {
    action: string;
    reason: string;
    buttonText: string;
    actionType: "create_encounter" | "document_screening" | "schedule_followup" | "info";
    priority: "immediate" | "soon" | "routine";
  };

  const specificIssues: SpecificIssue[] = [];
  const recommendations: Recommendation[] = [];

  console.log('🔧 Transforming Clinical Interpreter output:', analysis);

  // UPDATED: Use Clinical Interpreter's reasons directly with better data extraction
  if (analysis.reasons && Array.isArray(analysis.reasons)) {
    analysis.reasons.forEach((reason: any) => {
      console.log('🔧 Processing reason:', reason);
      
      const category = this.mapReasonToCategory(reason.category, reason.statement);
      
      specificIssues.push({
        category,
        issue: reason.reason,
        currentValue: this.extractCurrentValueFromReason(reason),
        requiredValue: this.extractRequiredValueFromReason(reason),
        priority: reason.priority || "high",
        actionable: reason.category !== "intrinsic"
      });
    });
  }

  // UPDATED: Only use recommendations, skip nextSteps to avoid duplicates
  if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
    analysis.recommendations.forEach((rec: any, index: number) => {
      recommendations.push({
        action: rec.action || rec.message || rec,
        reason: `${patientName} needs: ${rec.action || rec.message || rec}`,
        buttonText: this.getButtonTextForRecommendation(rec),
        actionType: this.mapRecommendationToActionType(rec),
        priority: "immediate"
      });
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

// UPDATED: Better data extraction methods

private extractCurrentValueFromReason(reason: any): string | number {
  const desc = reason.reason || "";
  
  // Look for explicit current value patterns
  const currentMatch = desc.match(/current:?\s*(\d+)/i);
  if (currentMatch) {
    return parseInt(currentMatch[1]);
  }
  
  // Look for "Missing X" or "Need X more" patterns
  const needMoreMatch = desc.match(/need\s+(\d+)\s+more/i);
  if (needMoreMatch) {
    return 0; // If they need X more, they currently have 0
  }
  
  // Look for specific count patterns
  if (desc.toLowerCase().includes('count') && desc.includes('0')) {
    return 0;
  }
  
  // Check for existence patterns
  if (desc.toLowerCase().includes('exist') || desc.toLowerCase().includes('at least one')) {
    return 0; // If it doesn't exist, current is 0
  }
  
  return 0; // Default to 0 for missing items
}

private extractRequiredValueFromReason(reason: any): string | number {
  const desc = reason.reason || "";
  
  // Look for ">= X" patterns
  const gteMatch = desc.match(/>=\s*(\d+)/i);
  if (gteMatch) {
    return parseInt(gteMatch[1]);
  }
  
  // Look for "at least X" patterns
  const atLeastMatch = desc.match(/at least\s+(\d+)/i);
  if (atLeastMatch) {
    return parseInt(atLeastMatch[1]);
  }
  
  // Look for "X more" patterns
  const moreMatch = desc.match(/(\d+)\s+more/i);
  if (moreMatch) {
    return parseInt(moreMatch[1]);
  }
  
  // Look for existence requirements
  if (desc.toLowerCase().includes('exist') || desc.toLowerCase().includes('at least one')) {
    return 1;
  }
  
  // Look for OR patterns
  if (desc.includes('OR') || desc.includes('2+') || desc.includes('1+')) {
    return "2+ visits OR 1+ preventive";
  }
  
  return "Required";
}

private getButtonTextForRecommendation(rec: any): string {
  const action = rec.action || rec.message || rec;
  
  if (typeof action === 'string') {
    if (action.toLowerCase().includes('encounter') || action.toLowerCase().includes('visit')) {
      return "+ Create Encounter";
    }
    if (action.toLowerCase().includes('screening') || action.toLowerCase().includes('tobacco')) {
      return "+ Document Screening";
    }
  }
  
  return "+ Take Action";
}

private mapRecommendationToActionType(rec: any): "create_encounter" | "document_screening" | "schedule_followup" | "info" {
  const action = rec.action || rec.message || rec;
  
  if (typeof action === 'string') {
    if (action.toLowerCase().includes('encounter') || action.toLowerCase().includes('visit')) {
      return "create_encounter";
    }
    if (action.toLowerCase().includes('screening') || action.toLowerCase().includes('tobacco')) {
      return "document_screening";
    }
  }
  
  return "create_encounter"; // Default for most clinical actions
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

  private mapReasonToCategory(
    category: string,
    statement: string
  ): "age" | "encounters" | "screening" | "intervention" {
    if (statement?.toLowerCase().includes("age")) return "age";
    if (category === "intrinsic") return "age";
    if (statement?.toLowerCase().includes("count") || statement?.toLowerCase().includes("exists"))
      return "encounters";
    if (statement?.toLowerCase().includes("screening")) return "screening";
    return "encounters"; // Default for epistemological gaps
  }

  private extractCurrentValue(reason: any): string | number {
    // Look for current value in the reason description
    const desc = reason.reason || "";

    // Extract count patterns: "current: 0", "Need 2 more", etc.
    const countMatch =
      desc.match(/current:?\s*(\d+)/i) || desc.match(/(\d+)\s*(?:visits?|encounters?)/i);
    if (countMatch) {
      return parseInt(countMatch[1]);
    }

    // Extract status patterns
    if (desc.toLowerCase().includes("missing") || desc.toLowerCase().includes("not documented")) {
      return "Not documented";
    }

    return "Unknown";
  }

  private extractRequiredValue(reason: any): string | number {
    const desc = reason.reason || "";

    // Extract requirement patterns: "Need 2 more", ">=2", "OR 1+", etc.
    const requirementMatch =
      desc.match(/(?:need|required?):?\s*(\d+)/i) ||
      desc.match(/>=\s*(\d+)/i) ||
      desc.match(/(\d+)\+?\s*(?:more|additional)/i);

    if (requirementMatch) {
      return parseInt(requirementMatch[1]);
    }

    // Look for OR logic patterns
    if (desc.includes("OR")) {
      return desc.match(/\d+\+?\s*[\w\s]*OR\s*\d+\+?\s*[\w\s]*/i)?.[0] || "See description";
    }

    return "Required";
  }

  private getButtonText(category: string): string {
    switch (category?.toLowerCase()) {
      case "clinical_action":
      case "encounters":
      case "clinical_documentation":
        return "+ Create Encounter";
      case "screening":
        return "+ Document Screening";
      default:
        return "+ Take Action";
    }
  }

  private mapToActionType(
    category: string
  ): "create_encounter" | "document_screening" | "schedule_followup" | "info" {
    switch (category?.toLowerCase()) {
      case "clinical_action":
      case "encounters":
      case "clinical_documentation":
        return "create_encounter";
      case "screening":
        return "document_screening";
      case "followup":
        return "schedule_followup";
      default:
        return "info";
    }
  }
}

// Export singleton instance
export const enhancedGuidanceService = new EnhancedGuidanceService();
