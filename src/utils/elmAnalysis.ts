/**
 * Generic ELM Abstract Syntax Tree Analysis
 * 
 * This module provides generic AST traversal and analysis for any ELM expression tree,
 * independent of clinical domain or specific measure logic.
 */

// ===== CORE AST NODE TYPES =====

interface ASTNode {
  localId: string;
  type: string;
  operand?: ASTNode[];
  [key: string]: any; // Allow additional ELM properties
}

interface ASTTraversalResult {
  node: ASTNode;
  depth: number;
  path: string[];
  parent?: ASTNode;
}

// ===== GENERIC AST TRAVERSAL ENGINE =====

export class ELMASTTraverser {
  /**
   * Performs depth-first traversal of an ELM AST
   * Generic - works for any ELM expression tree structure
   */
  traverse(
    rootNode: ASTNode, 
    visitor: (result: ASTTraversalResult) => void,
    parentPath: string[] = []
  ): void {
    const currentPath = [...parentPath, rootNode.localId];
    
    // Visit current node
    visitor({
      node: rootNode,
      depth: parentPath.length,
      path: currentPath,
      parent: undefined // Could be enhanced to track parent
    });
    
    // Recursively traverse operands (children)
    if (rootNode.operand && Array.isArray(rootNode.operand)) {
      rootNode.operand.forEach((child, index) => {
        if (this.isValidASTNode(child)) {
          this.traverse(child, visitor, currentPath);
        }
      });
    }
    
    // Handle other child node patterns in ELM
    this.traverseOtherChildren(rootNode, visitor, currentPath);
  }
  
  /**
   * ELM has various child node patterns beyond 'operand'
   * This handles source, expression, etc.
   */
  private traverseOtherChildren(
    node: ASTNode, 
    visitor: (result: ASTTraversalResult) => void,
    currentPath: string[]
  ): void {
    // Handle 'source' nodes (common in Count, Exists operations)
    if (node.source && this.isValidASTNode(node.source)) {
      this.traverse(node.source, visitor, currentPath);
    }
    
    // Handle nested 'expression' nodes
    if (node.expression && this.isValidASTNode(node.expression)) {
      this.traverse(node.expression, visitor, currentPath);
    }
    
    // Handle 'operand' as single node (not array)
    if (node.operand && !Array.isArray(node.operand) && this.isValidASTNode(node.operand)) {
      this.traverse(node.operand, visitor, currentPath);
    }
  }
  
  private isValidASTNode(obj: any): obj is ASTNode {
    return obj && typeof obj === 'object' && obj.localId && obj.type;
  }
}

// ===== FAILURE PATH ANALYSIS =====

export class FailurePathAnalyzer {
  private traverser = new ELMASTTraverser();
  
  /**
   * Finds the specific path through the AST that led to a failure
   * Generic algorithm - works for any boolean expression tree
   */
  findFailurePath(
    rootNode: ASTNode,
    clauseResults: Map<string, ClauseExecutionResult>
  ): FailurePath {
    const failedNodes: ASTNode[] = [];
    const criticalPath: string[] = [];
    
    this.traverser.traverse(rootNode, (result) => {
      const clauseResult = clauseResults.get(result.node.localId);
      
      if (clauseResult && this.isFailureNode(result.node, clauseResult)) {
        failedNodes.push(result.node);
        
        // For boolean logic, find the critical failure path
        if (this.isCriticalFailure(result.node, clauseResult)) {
          criticalPath.push(result.node.localId);
        }
      }
    });
    
    return {
      rootFailure: this.isFailureResult(clauseResults.get(rootNode.localId)),
      failedNodes,
      criticalPath,
      logicAnalysis: this.analyzeBooleanLogic(rootNode, clauseResults)
    };
  }
  
  /**
   * Analyzes boolean logic failures generically
   * Understands AND (all must be true) vs OR (any can be true) semantics
   */
  private analyzeBooleanLogic(
    node: ASTNode,
    clauseResults: Map<string, ClauseExecutionResult>
  ): BooleanLogicAnalysis {
    switch (node.type) {
      case 'And':
        return this.analyzeAndLogic(node, clauseResults);
      case 'Or':
        return this.analyzeOrLogic(node, clauseResults);
      default:
        return { type: 'LEAF', operator: node.type };
    }
  }
  
  private analyzeAndLogic(node: ASTNode, clauseResults: Map<string, ClauseExecutionResult>): BooleanLogicAnalysis {
    const operandResults = node.operand?.map(operand => ({
      localId: operand.localId,
      result: clauseResults.get(operand.localId)?.final || 'UNKNOWN'
    })) || [];
    
    // In AND logic, ANY false operand causes overall failure
    const falseOperands = operandResults.filter(op => op.result === 'FALSE');
    
    return {
      type: 'AND',
      operator: 'And',
      operandResults,
      criticalFailures: falseOperands, // Any false operand is critical
      explanation: falseOperands.length > 0 
        ? `AND failed: ${falseOperands.length} of ${operandResults.length} conditions failed`
        : 'AND passed: all conditions met'
    };
  }
  
  private analyzeOrLogic(node: ASTNode, clauseResults: Map<string, ClauseExecutionResult>): BooleanLogicAnalysis {
    const operandResults = node.operand?.map(operand => ({
      localId: operand.localId,
      result: clauseResults.get(operand.localId)?.final || 'UNKNOWN'
    })) || [];
    
    // In OR logic, ALL must be false for overall failure
    const falseOperands = operandResults.filter(op => op.result === 'FALSE');
    const trueOperands = operandResults.filter(op => op.result === 'TRUE');
    
    return {
      type: 'OR',
      operator: 'Or',
      operandResults,
      criticalFailures: trueOperands.length === 0 ? falseOperands : [], // All false is critical
      explanation: trueOperands.length > 0
        ? `OR passed: ${trueOperands.length} of ${operandResults.length} conditions met`
        : `OR failed: all ${falseOperands.length} conditions failed`
    };
  }
  
  private isFailureNode(node: ASTNode, result: ClauseExecutionResult): boolean {
    return result.final === 'FALSE';
  }
  
  private isCriticalFailure(node: ASTNode, result: ClauseExecutionResult): boolean {
    // A node is critical if its failure directly contributes to the overall failure
    return result.final === 'FALSE';
  }
  
  private isFailureResult(result: ClauseExecutionResult | undefined): boolean {
    return result?.final === 'FALSE';
  }
}

// ===== REQUIREMENT PATTERN DETECTOR =====

export class RequirementPatternDetector {
  /**
   * Detects common requirement patterns in ELM AST
   * Generic patterns that appear across all clinical domains
   */
  detectPatterns(node: ASTNode, clauseResults: Map<string, ClauseExecutionResult>): RequirementPattern[] {
    const patterns: RequirementPattern[] = [];
    const traverser = new ELMASTTraverser();
    
    traverser.traverse(node, (result) => {
      const pattern = this.identifyNodePattern(result.node, clauseResults);
      if (pattern) {
        patterns.push(pattern);
      }
    });
    
    return patterns;
  }
  
  private identifyNodePattern(node: ASTNode, clauseResults: Map<string, ClauseExecutionResult>): RequirementPattern | null {
    switch (node.type) {
      case 'GreaterOrEqual':
        return this.detectComparisonPattern(node, clauseResults, 'GREATER_OR_EQUAL');
      case 'Count':
        return this.detectCountPattern(node, clauseResults);
      case 'Exists':
        return this.detectExistsPattern(node, clauseResults);
      case 'CalculateAgeAt':
        return this.detectAgePattern(node, clauseResults);
      default:
        return null;
    }
  }
  
  private detectComparisonPattern(
    node: ASTNode, 
    clauseResults: Map<string, ClauseExecutionResult>,
    comparisonType: string
  ): RequirementPattern {
    const result = clauseResults.get(node.localId);
    const thresholdValue = this.extractThresholdValue(node);
    const actualValue = this.extractActualValue(node, clauseResults);
    
    return {
      type: 'COMPARISON_REQUIREMENT',
      subtype: comparisonType,
      localId: node.localId,
      description: `Value must be ${comparisonType.toLowerCase().replace('_', ' ')} ${thresholdValue}`,
      currentValue: actualValue,
      requiredValue: thresholdValue,
      passed: result?.final === 'TRUE',
      actionable: this.isComparisonActionable(node)
    };
  }
  
  private detectCountPattern(node: ASTNode, clauseResults: Map<string, ClauseExecutionResult>): RequirementPattern {
    const result = clauseResults.get(node.localId);
    const actualCount = result?.raw || 0;
    const sourceDescription = this.extractSourceDescription(node);
    
    return {
      type: 'COUNT_REQUIREMENT',
      localId: node.localId,
      description: `Count of ${sourceDescription}`,
      currentValue: actualCount,
      requiredValue: 'determined by parent comparison',
      passed: result?.final === 'TRUE',
      actionable: true // Count requirements are usually actionable
    };
  }
  
  private detectExistsPattern(node: ASTNode, clauseResults: Map<string, ClauseExecutionResult>): RequirementPattern {
    const result = clauseResults.get(node.localId);
    const actualValue = result?.raw || [];
    const sourceDescription = this.extractSourceDescription(node);
    
    return {
      type: 'EXISTS_REQUIREMENT',
      localId: node.localId,
      description: `At least one ${sourceDescription} must exist`,
      currentValue: Array.isArray(actualValue) ? actualValue.length : actualValue,
      requiredValue: '1 or more',
      passed: result?.final === 'TRUE',
      actionable: true
    };
  }
  
  private detectAgePattern(node: ASTNode, clauseResults: Map<string, ClauseExecutionResult>): RequirementPattern {
    const result = clauseResults.get(node.localId);
    const calculatedAge = result?.raw || 0;
    
    return {
      type: 'AGE_REQUIREMENT',
      localId: node.localId,
      description: 'Patient age calculation',
      currentValue: calculatedAge,
      requiredValue: 'determined by parent comparison',
      passed: result?.final === 'TRUE',
      actionable: false // Age is intrinsic
    };
  }
  
  // Helper methods for pattern detection
  private extractThresholdValue(node: ASTNode): any {
    // Find literal values in operands
    const literalOperand = node.operand?.find(op => op.type === 'Literal');
    return literalOperand?.value || 'unknown';
  }
  
  private extractActualValue(node: ASTNode, clauseResults: Map<string, ClauseExecutionResult>): any {
    // Find the non-literal operand and get its result
    const nonLiteralOperand = node.operand?.find(op => op.type !== 'Literal');
    return nonLiteralOperand ? clauseResults.get(nonLiteralOperand.localId)?.raw : 'unknown';
  }
  
  private extractSourceDescription(node: ASTNode): string {
    // Extract human-readable description from ExpressionRef
    if (node.source?.type === 'ExpressionRef') {
      return node.source.name || 'items';
    }
    return 'items';
  }
  
  private isComparisonActionable(node: ASTNode): boolean {
    // Age comparisons are typically not actionable (intrinsic)
    const hasAgeCalculation = node.operand?.some(op => 
      op.type === 'CalculateAgeAt' || op.type === 'AgeInYearsAt'
    );
    return !hasAgeCalculation;
  }
}

// ===== TYPE DEFINITIONS =====

interface ClauseExecutionResult {
  localId: string;
  final: 'TRUE' | 'FALSE' | 'UNHIT' | 'NA';
  raw: any;
}

interface FailurePath {
  rootFailure: boolean;
  failedNodes: ASTNode[];
  criticalPath: string[];
  logicAnalysis: BooleanLogicAnalysis;
}

interface BooleanLogicAnalysis {
  type: 'AND' | 'OR' | 'LEAF';
  operator: string;
  operandResults?: Array<{ localId: string; result: string }>;
  criticalFailures?: Array<{ localId: string; result: string }>;
  explanation?: string;
}

export interface RequirementPattern {
  type: 'COMPARISON_REQUIREMENT' | 'COUNT_REQUIREMENT' | 'EXISTS_REQUIREMENT' | 'AGE_REQUIREMENT';
  subtype?: string;
  localId: string;
  description: string;
  currentValue: any;
  requiredValue: any;
  passed: boolean;
  actionable: boolean;
}