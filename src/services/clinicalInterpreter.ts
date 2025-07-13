/**
 * Clinical Interpretation Service
 *
 * Orchestrates the transformation of ELM AST analysis into clinical guidance.
 * Uses fqm-execution's proven helpers for ELM parsing and adds clinical intelligence.
 */

import { Calculator, ELMHelpers, ELMDependencyHelpers, MeasureBundleHelpers } from "fqm-execution";

// ===== MAIN CLINICAL INTERPRETER =====

export class ClinicalInterpreter {
  /**
   * Main entry point: Transform technical clause failures into clinical guidance
   */
  interpretMeasureFailures(
    clauseResults: ClauseResult[],
    elmDefinition: any,
    patientAge: number
  ): ClinicalGuidance {
    console.log("🎯 Clinical Interpreter - Starting analysis...");

    try {
      // Step 1: Convert clause results to lookup map
      const clauseMap = this.buildClauseResultMap(clauseResults);

      // Step 2: Find root statement failures (e.g., "Initial Population")
      const rootFailures = this.identifyRootFailures(clauseResults, elmDefinition);

      if (rootFailures.length === 0) {
        console.log("🎯 No root failures found - measure appears complete");
        return this.createSuccessGuidance();
      }

      // Step 3: Analyze each root failure using fqm-execution helpers
      const failureAnalyses = rootFailures.map((failure) =>
        this.analyzeRootFailure(failure, clauseMap, elmDefinition)
      );

      // Step 4: Extract clinical requirements from patterns
      const allRequirements = failureAnalyses.flatMap((analysis) => analysis.requirements);

      // Step 5: Classify actionability (intrinsic vs epistemological)
      const actionabilityAssessment = this.classifyActionability(allRequirements, patientAge);

      // Step 6: Generate clinical guidance
      const guidance = this.generateClinicalGuidance(actionabilityAssessment);

      console.log("🎯 Clinical interpretation complete:", {
        rootFailures: rootFailures.length,
        requirements: allRequirements.length,
        actionable: actionabilityAssessment.actionableGaps.length,
      });

      return guidance;
    } catch (error) {
      console.error("🎯 Clinical interpretation failed:", error);
      return this.createErrorGuidance(error);
    }
  }

  // ===== STEP 1: BUILD CLAUSE RESULT MAP =====

  private buildClauseResultMap(clauseResults: ClauseResult[]): Map<string, ClauseExecutionResult> {
    const map = new Map<string, ClauseExecutionResult>();

    clauseResults.forEach((clause) => {
      map.set(clause.localId, {
        localId: clause.localId,
        final: clause.final as "TRUE" | "FALSE" | "UNHIT" | "NA",
        raw: clause.raw,
        statementName: clause.statementName,
        libraryName: clause.libraryName,
      });
    });

    console.log("🎯 Built clause map with", map.size, "clauses");
    return map;
  }

  // ===== STEP 2: IDENTIFY ROOT FAILURES =====

  private identifyRootFailures(clauseResults: ClauseResult[], elmDefinition: any): RootFailure[] {
    const rootFailures: RootFailure[] = [];

    // Look for failed population statements
    const populationStatements = ["Initial Population", "Denominator", "Numerator"];

    populationStatements.forEach((statementName) => {
      const statementFailures = clauseResults.filter(
        (clause) => clause.statementName === statementName && clause.final === "FALSE"
      );

      if (statementFailures.length > 0) {
        // Find the root clause for this statement
        const rootClause = this.findRootClauseForStatement(statementName, elmDefinition);
        if (rootClause) {
          rootFailures.push({
            statementName,
            rootLocalId: rootClause.localId,
            elmNode: rootClause,
            failedClauses: statementFailures,
          });
        }
      }
    });

    console.log(
      "🎯 Found root failures:",
      rootFailures.map((f) => f.statementName)
    );
    return rootFailures;
  }

  private findRootClauseForStatement(statementName: string, elmDefinition: any): any {
    const statements = elmDefinition?.library?.statements?.def || [];
    const statement = statements.find((stmt: any) => stmt.name === statementName);
    return statement?.expression || null;
  }

  // ===== STEP 3: ANALYZE ROOT FAILURE USING fqm-execution helpers =====

  private analyzeRootFailure(
    rootFailure: RootFailure,
    clauseMap: Map<string, ClauseExecutionResult>,
    elmDefinition: any
  ): FailureAnalysis {
    console.log("🎯 Analyzing failure:", rootFailure.statementName);

    // Use fqm-execution's ELMHelpers to find all failed clauses in this statement
    const failurePath = this.findFailurePathUsingFqmHelpers(rootFailure, clauseMap, elmDefinition);

    // Detect clinical requirement patterns in the failed nodes
    const patterns = this.detectClinicalPatterns(
      failurePath.failedClauses,
      clauseMap,
      elmDefinition
    );

    // Convert patterns to clinical requirements
    const requirements = patterns.map((pattern) => this.patternToRequirement(pattern, clauseMap));

    return {
      statementName: rootFailure.statementName,
      failurePath,
      patterns,
      requirements,
      logicSummary: this.summarizeLogicFailure(failurePath),
    };
  }

  // NEW: Use fqm-execution's ELMHelpers to find failed clauses
  private findFailurePathUsingFqmHelpers(
    rootFailure: RootFailure,
    clauseMap: Map<string, ClauseExecutionResult>,
    elmDefinition: any
  ): any {
    const failedClauses: any[] = [];
    const elmLibrary = elmDefinition; // Assuming this is the ELM library structure

    // Use ELMHelpers to find each failed clause by localId
    clauseMap.forEach((clauseResult, localId) => {
      if (
        clauseResult.final === "FALSE" &&
        clauseResult.statementName === rootFailure.statementName
      ) {
        // Use fqm-execution's helper to find the clause in the ELM tree
        const foundClause = ELMHelpers.findClauseInLibrary(elmLibrary, localId);
        if (foundClause) {
          failedClauses.push({
            localId,
            clause: foundClause,
            clauseResult,
          });
        }
      }
    });

    // Analyze the boolean logic structure
    const logicAnalysis = this.analyzeBooleanLogicStructure(rootFailure.elmNode, clauseMap);

    return {
      failedClauses,
      logicAnalysis,
      rootClause: rootFailure.elmNode,
    };
  }

  // NEW: Detect clinical patterns using the failed clauses found by fqm-execution helpers
  private detectClinicalPatterns(
    failedClauses: any[],
    clauseMap: Map<string, ClauseExecutionResult>,
    elmDefinition: any
  ): RequirementPattern[] {
    const patterns: RequirementPattern[] = [];

    failedClauses.forEach(({ clause, clauseResult }) => {
      // Detect COUNT >= threshold patterns
      if (this.isCountComparisonPattern(clause)) {
        patterns.push(this.createCountPattern(clause, clauseResult));
      }

      // Detect EXISTS patterns
      else if (this.isExistsPattern(clause)) {
        patterns.push(this.createExistsPattern(clause, clauseResult));
      }

      // Detect AGE comparison patterns
      else if (this.isAgeComparisonPattern(clause)) {
        patterns.push(this.createAgePattern(clause, clauseResult));
      }

      // Detect generic comparison patterns
      else if (this.isComparisonPattern(clause)) {
        patterns.push(this.createComparisonPattern(clause, clauseResult));
      }
    });

    return patterns;
  }

  // Pattern detection helpers using fqm-execution's ELM structure
  private isCountComparisonPattern(clause: any): boolean {
    return (
      clause.type === "GreaterOrEqual" &&
      clause.operand?.[0]?.type === "Count" &&
      clause.operand?.[1]?.type === "Literal"
    );
  }

  private isExistsPattern(clause: any): boolean {
    return clause.type === "Exists";
  }

  private isAgeComparisonPattern(clause: any): boolean {
    const leftOperand = clause.operand?.[0];
    return (
      clause.type === "GreaterOrEqual" &&
      (leftOperand?.type === "AgeInYears" ||
        leftOperand?.type === "AgeInYearsAt" ||
        (leftOperand?.name && leftOperand.name.toLowerCase().includes("age")))
    );
  }

  private isComparisonPattern(clause: any): boolean {
    return ["GreaterOrEqual", "Greater", "LessOrEqual", "Less", "Equal"].includes(clause.type);
  }

  // Pattern creation helpers
  private createCountPattern(clause: any, clauseResult: ClauseExecutionResult): RequirementPattern {
    const countOperand = clause.operand[0];
    const thresholdOperand = clause.operand[1];

    return {
      type: "COUNT_REQUIREMENT",
      localId: clause.localId,
      description: `Count must be >= ${thresholdOperand.value}`,
      currentValue: this.extractCountFromClauseResult(clauseResult),
      requiredValue: thresholdOperand.value,
      passed: clauseResult.final === "TRUE",
      actionable: true,
    };
  }

  private createExistsPattern(
    clause: any,
    clauseResult: ClauseExecutionResult
  ): RequirementPattern {
    return {
      type: "EXISTS_REQUIREMENT",
      localId: clause.localId,
      description: "At least one qualifying item must exist",
      currentValue: clauseResult.final === "TRUE" ? 1 : 0,
      requiredValue: 1,
      passed: clauseResult.final === "TRUE",
      actionable: true,
    };
  }

  private createAgePattern(clause: any, clauseResult: ClauseExecutionResult): RequirementPattern {
    const threshold = clause.operand?.[1]?.value || 0;

    return {
      type: "AGE_REQUIREMENT",
      localId: clause.localId,
      description: `Patient age must be >= ${threshold} years`,
      currentValue: this.extractAgeFromClauseResult(clauseResult),
      requiredValue: threshold,
      passed: clauseResult.final === "TRUE",
      actionable: false,
    };
  }

  private createComparisonPattern(
    clause: any,
    clauseResult: ClauseExecutionResult
  ): RequirementPattern {
    const operator = clause.type;
    const rightValue = clause.operand?.[1]?.value || "specified value";

    return {
      type: "COMPARISON_REQUIREMENT",
      localId: clause.localId,
      description: `Value must be ${operator} ${rightValue}`,
      currentValue: clauseResult.raw,
      requiredValue: rightValue,
      passed: clauseResult.final === "TRUE",
      actionable: true,
    };
  }

  // Helper methods to extract values from clause results
  private extractCountFromClauseResult(clauseResult: ClauseExecutionResult): number {
    if (clauseResult.raw && Array.isArray(clauseResult.raw)) {
      return clauseResult.raw.length;
    }
    return 0;
  }

  private extractAgeFromClauseResult(clauseResult: ClauseExecutionResult): number {
    // In a real implementation, you'd extract the actual age from the raw result
    // For now, return a placeholder - this would need to be enhanced based on actual data structure
    return typeof clauseResult.raw === "number" ? clauseResult.raw : 0;
  }

  private analyzeBooleanLogicStructure(
    elmNode: any,
    clauseMap: Map<string, ClauseExecutionResult>
  ): any {
    if (elmNode.type === "And") {
      return {
        type: "AND",
        explanation: "AND logic requires all conditions to be true",
        operator: "And",
      };
    } else if (elmNode.type === "Or") {
      return {
        type: "OR",
        explanation: "OR logic requires at least one condition to be true",
        operator: "Or",
      };
    }
    return {
      type: "LEAF",
      explanation: "Single condition evaluation",
      operator: elmNode.type,
    };
  }

  // ===== CLINICAL REQUIREMENT CONVERSION =====

  private patternToRequirement(
    pattern: RequirementPattern,
    clauseMap: Map<string, ClauseExecutionResult>
  ): ClinicalRequirement {
    switch (pattern.type) {
      case "COMPARISON_REQUIREMENT":
        return this.createComparisonRequirement(pattern);
      case "COUNT_REQUIREMENT":
        return this.createCountRequirement(pattern, clauseMap);
      case "EXISTS_REQUIREMENT":
        return this.createExistsRequirement(pattern);
      case "AGE_REQUIREMENT":
        return this.createAgeRequirement(pattern);
      default:
        return this.createGenericRequirement(pattern);
    }
  }

  private createComparisonRequirement(pattern: RequirementPattern): ClinicalRequirement {
    return {
      type: "COMPARISON",
      description: pattern.description,
      currentValue: pattern.currentValue,
      requiredValue: pattern.requiredValue,
      passed: pattern.passed,
      actionable: pattern.actionable,
      category: pattern.actionable ? "epistemological" : "intrinsic",
      priority: pattern.passed ? "low" : pattern.actionable ? "high" : "info",
    };
  }

  private createCountRequirement(
    pattern: RequirementPattern,
    clauseMap: Map<string, ClauseExecutionResult>
  ): ClinicalRequirement {
    return {
      type: "COUNT",
      description: pattern.description,
      currentValue: pattern.currentValue,
      requiredValue: pattern.requiredValue,
      passed: pattern.passed,
      actionable: true,
      category: "epistemological",
      priority: pattern.passed ? "low" : "high",
    };
  }

  private createExistsRequirement(pattern: RequirementPattern): ClinicalRequirement {
    return {
      type: "EXISTS",
      description: pattern.description,
      currentValue: pattern.currentValue,
      requiredValue: 1,
      passed: pattern.passed,
      actionable: true,
      category: "epistemological",
      priority: pattern.passed ? "low" : "high",
    };
  }

  private createAgeRequirement(pattern: RequirementPattern): ClinicalRequirement {
    return {
      type: "AGE",
      description: pattern.description,
      currentValue: pattern.currentValue,
      requiredValue: pattern.requiredValue,
      passed: pattern.passed,
      actionable: false,
      category: "intrinsic",
      priority: "info",
    };
  }

  private createGenericRequirement(pattern: RequirementPattern): ClinicalRequirement {
    return {
      type: "GENERIC",
      description: pattern.description,
      currentValue: pattern.currentValue,
      requiredValue: pattern.requiredValue,
      passed: pattern.passed,
      actionable: pattern.actionable,
      category: pattern.actionable ? "epistemological" : "intrinsic",
      priority: pattern.passed ? "low" : "medium",
    };
  }

  private summarizeLogicFailure(failurePath: any): string {
    if (failurePath.logicAnalysis.type === "AND") {
      return `AND logic failed: ${failurePath.logicAnalysis.explanation}`;
    } else if (failurePath.logicAnalysis.type === "OR") {
      return `OR logic failed: ${failurePath.logicAnalysis.explanation}`;
    }
    return "Logic analysis not available";
  }

  // ===== ACTIONABILITY CLASSIFICATION & GUIDANCE GENERATION =====

  private classifyActionability(
    requirements: ClinicalRequirement[],
    patientAge: number
  ): ActionabilityAssessment {
    const intrinsicBlockers = requirements.filter(
      (req) => req.category === "intrinsic" && !req.passed
    );
    const actionableGaps = requirements.filter(
      (req) => req.category === "epistemological" && !req.passed
    );

    return {
      category: intrinsicBlockers.length > 0 ? "intrinsic" : "epistemological",
      intrinsicBlockers,
      actionableGaps,
      allRequirements: requirements,
      hasBlockers: intrinsicBlockers.length > 0,
      hasActionableGaps: actionableGaps.length > 0,
    };
  }

  private generateClinicalGuidance(assessment: ActionabilityAssessment): ClinicalGuidance {
    if (assessment.hasBlockers) {
      return this.createIntrinsicGuidance(assessment.intrinsicBlockers);
    }

    if (assessment.hasActionableGaps) {
      return this.createActionableGuidance(assessment.actionableGaps);
    }

    return this.createSuccessGuidance();
  }

  private createIntrinsicGuidance(blockers: ClinicalRequirement[]): ClinicalGuidance {
    const primaryBlocker = blockers[0];

    return {
      status: "not_eligible",
      category: "intrinsic",
      message: `Patient does not meet measure criteria: ${primaryBlocker.description}`,
      summary: `Not eligible due to ${primaryBlocker.type.toLowerCase()} requirement`,
      requirements: blockers,
      recommendations: [],
      actionable: false,
      priority: "info",
    };
  }

  private createActionableGuidance(gaps: ClinicalRequirement[]): ClinicalGuidance {
    const recommendations = gaps.map((gap) => this.gapToRecommendation(gap));
    const summary = this.buildActionableSummary(gaps);

    return {
      status: "eligible_needs_action",
      category: "epistemological",
      message: summary,
      summary: "Patient meets basic criteria but needs additional documentation",
      requirements: gaps,
      recommendations,
      actionable: true,
      priority: this.calculatePriority(gaps),
    };
  }

  private createSuccessGuidance(): ClinicalGuidance {
    return {
      status: "measure_complete",
      category: "success",
      message: "All measure requirements met",
      summary: "Patient meets all measure criteria",
      requirements: [],
      recommendations: [],
      actionable: false,
      priority: "low",
    };
  }

  private createErrorGuidance(error: any): ClinicalGuidance {
    return {
      status: "analysis_error",
      category: "error",
      message: "Unable to analyze measure requirements",
      summary: "Technical analysis error occurred",
      requirements: [],
      recommendations: ["Contact support for assistance"],
      actionable: false,
      priority: "medium",
    };
  }

  private gapToRecommendation(gap: ClinicalRequirement): string {
    switch (gap.type) {
      case "COUNT":
        return `Document ${gap.requiredValue - gap.currentValue} more qualifying encounters`;
      case "EXISTS":
        return `Document at least one qualifying encounter`;
      case "COMPARISON":
        return `Ensure requirement is met: ${gap.description}`;
      default:
        return `Address requirement: ${gap.description}`;
    }
  }

  private buildActionableSummary(gaps: ClinicalRequirement[]): string {
    if (gaps.length === 1) {
      return `Missing: ${gaps[0].description}`;
    }
    return `Missing ${gaps.length} requirements: ${gaps.map((g) => g.type).join(", ")}`;
  }

  private calculatePriority(gaps: ClinicalRequirement[]): "high" | "medium" | "low" {
    const highPriorityGaps = gaps.filter((gap) => gap.priority === "high");
    if (highPriorityGaps.length > 0) return "high";

    const mediumPriorityGaps = gaps.filter((gap) => gap.priority === "medium");
    if (mediumPriorityGaps.length > 0) return "medium";

    return "low";
  }
}

// ===== TYPE DEFINITIONS =====

interface ClauseResult {
  localId: string;
  final: string;
  raw: any;
  statementName: string;
  libraryName: string;
}

interface ClauseExecutionResult {
  localId: string;
  final: "TRUE" | "FALSE" | "UNHIT" | "NA";
  raw: any;
  statementName: string;
  libraryName: string;
}

interface RootFailure {
  statementName: string;
  rootLocalId: string;
  elmNode: any;
  failedClauses: ClauseResult[];
}

interface FailureAnalysis {
  statementName: string;
  failurePath: any;
  patterns: RequirementPattern[];
  requirements: ClinicalRequirement[];
  logicSummary: string;
}

interface RequirementPattern {
  type: "COMPARISON_REQUIREMENT" | "COUNT_REQUIREMENT" | "EXISTS_REQUIREMENT" | "AGE_REQUIREMENT";
  localId: string;
  description: string;
  currentValue: any;
  requiredValue: any;
  passed: boolean;
  actionable: boolean;
}

interface ClinicalRequirement {
  type: string;
  description: string;
  currentValue: any;
  requiredValue: any;
  passed: boolean;
  actionable: boolean;
  category: "intrinsic" | "epistemological";
  priority: "high" | "medium" | "low" | "info";
}

interface ActionabilityAssessment {
  category: "intrinsic" | "epistemological";
  intrinsicBlockers: ClinicalRequirement[];
  actionableGaps: ClinicalRequirement[];
  allRequirements: ClinicalRequirement[];
  hasBlockers: boolean;
  hasActionableGaps: boolean;
}

export interface ClinicalGuidance {
  status: "measure_complete" | "eligible_needs_action" | "not_eligible" | "analysis_error";
  category: "intrinsic" | "epistemological" | "success" | "error";
  message: string;
  summary: string;
  requirements: ClinicalRequirement[];
  recommendations: string[];
  actionable: boolean;
  priority: "high" | "medium" | "low" | "info";
}
