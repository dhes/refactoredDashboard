// src/components/dashboard/EnhancedGuidanceDisplay.tsx

import React from 'react';
import { useEnhancedGuidance } from '../../hooks/useEnhancedGuidance';

interface EnhancedGuidanceDisplayProps {
  measureId: string;
  patientId: string;
  onCreateEncounter?: () => void;
  onDocumentScreening?: () => void;
  onScheduleFollowup?: () => void;
}

const EnhancedGuidanceDisplay: React.FC<EnhancedGuidanceDisplayProps> = ({
  measureId,
  patientId,
  onCreateEncounter,
  onDocumentScreening,
  onScheduleFollowup
}) => {
  const { guidance, loading, error } = useEnhancedGuidance(measureId, patientId);

  if (loading) {
    return (
      <div className="enhanced-guidance loading">
        <div className="loading-spinner">Analyzing measure requirements...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enhanced-guidance error">
        <div className="error-message">
          ⚠️ Unable to analyze measure requirements: {error.message}
        </div>
      </div>
    );
  }

  if (!guidance) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'measure_complete': return '✅';
      case 'eligible_needs_screening': return '⚠️';
      case 'not_eligible': return '❌';
      default: return '❓';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'measure_complete': return 'All requirements met';
      case 'eligible_needs_screening': return 'Eligible but needs documentation';
      case 'not_eligible': return 'Not eligible for measure';
      default: return 'Status needs review';
    }
  };

  const handleActionClick = (actionType: string) => {
    switch (actionType) {
      case 'create_encounter':
        onCreateEncounter?.();
        break;
      case 'document_screening':
        onDocumentScreening?.();
        break;
      case 'schedule_followup':
        onScheduleFollowup?.();
        break;
    }
  };

  return (
    <div className="enhanced-guidance">
      {/* Patient Status Header */}
      <div className="patient-status-header">
        <h4 className="patient-title">
          {getStatusIcon(guidance.status)} {guidance.patientName} ({guidance.patientAge} years old)
        </h4>
        <p className="status-subtitle">{getStatusMessage(guidance.status)}</p>
        {guidance.isEnhanced && (
          <span className="enhanced-badge">🔬 Enhanced Analysis</span>
        )}
      </div>

      {/* Specific Issues */}
      {guidance.specificIssues.length > 0 && (
        <div className="specific-issues">
          <h5 className="section-title">📋 Current Status</h5>
          <div className="issues-grid">
            {guidance.specificIssues.map((issue, idx) => (
              <div key={idx} className={`issue-card priority-${issue.priority}`}>
                <div className="issue-category">{issue.category.replace('_', ' ')}</div>
                <div className="issue-description">{issue.issue}</div>
                <div className="issue-comparison">
                  <div className="current-value">
                    <span className="label">Current:</span>
                    <span className="value">{issue.currentValue}</span>
                  </div>
                  <div className="required-value">
                    <span className="label">Required:</span>
                    <span className="value">{issue.requiredValue}</span>
                  </div>
                </div>
                {!issue.actionable && (
                  <div className="non-actionable">ℹ️ No action needed</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Recommendations */}
      {guidance.recommendations.length > 0 && (
        <div className="recommendations">
          <h5 className="section-title">🎯 Recommended Actions</h5>
          <div className="recommendations-list">
            {guidance.recommendations.map((rec, idx) => (
              <div key={idx} className={`recommendation-card priority-${rec.priority}`}>
                <div className="recommendation-content">
                  <div className="recommendation-action">{rec.action}</div>
                  <div className="recommendation-reason">{rec.reason}</div>
                </div>
                <button
                  className={`action-button ${rec.actionType} priority-${rec.priority}`}
                  onClick={() => handleActionClick(rec.actionType)}
                >
                  {rec.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback Comparison (for debugging/validation) */}
      {guidance.isEnhanced && (
        <details className="fallback-comparison">
          <summary>🔧 Fallback Comparison (Dev Only)</summary>
          <div className="fallback-content">
            <strong>Fallback logic says:</strong> {guidance.fallbackGuidance.message}
            {guidance.fallbackGuidance.action && (
              <div><strong>Action:</strong> {guidance.fallbackGuidance.action}</div>
            )}
          </div>
        </details>
      )}

      {/* Enhancement Status */}
      <div className="enhancement-status">
        {guidance.isEnhanced ? (
          <small className="enhanced-status">
            ✨ Using enhanced clause-level analysis for precise recommendations
          </small>
        ) : (
          <small className="fallback-status">
            ⚡ Using standard analysis (enhanced analysis unavailable)
          </small>
        )}
      </div>
    </div>
  );
};

export default EnhancedGuidanceDisplay;