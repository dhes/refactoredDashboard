import React from 'react';
import { usePopulationAnalysis } from '../../hooks/useQualityAnalytics';

// Define types for the analysis data structure
interface AnalysisReason {
  statement: string;
  reason: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  action?: string;
}

interface MeasureAnalysisData {
  excluded: boolean;
  reasons?: AnalysisReason[];
  patientStatus?: {
    eligibleForMeasure: boolean;
    ageQualified: boolean;
    visitQualified: boolean;
    hasScreening: boolean;
    currentMeasureStatus: string;
  };
  recommendations?: Array<{
    priority: 'high' | 'medium' | 'low';
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

interface MeasureAnalysisProps {
  measureId: string;
  patientId: string;
}

interface UsePopulationAnalysisResult {
  analysis: MeasureAnalysisData | null;
  loading: boolean;
  error: Error | null;
}

const MeasureAnalysis: React.FC<MeasureAnalysisProps> = ({ measureId, patientId }) => {
  const { analysis, loading, error }: UsePopulationAnalysisResult = usePopulationAnalysis(measureId, patientId);

  if (loading) return <div className="loading">Analyzing measure...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;
  if (!analysis) return null;

  return (
    <div className="measure-analysis">
      <h3>Measure Analysis</h3>
      
      {analysis.excluded ? (
        <div className="exclusion-reasons">
          <h4>❌ Not in Initial Population</h4>
          {analysis.reasons && analysis.reasons.length > 0 ? (
            <ul className="reasons-list">
              {analysis.reasons.map((reason: AnalysisReason, idx: number) => (
                <li key={idx} className={`reason-item priority-${reason.priority || 'medium'}`}>
                  <strong>{reason.statement}:</strong> {reason.reason}
                  {reason.action && (
                    <div className="suggested-action">
                      <em>Suggested action: {reason.action}</em>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No specific reasons available</p>
          )}
          
          {/* Enhanced recommendations section */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>📋 Recommendations</h4>
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className={`recommendation priority-${rec.priority}`}>
                  <div className="rec-message">{rec.message}</div>
                  <div className="rec-action">
                    <strong>Action:</strong> {rec.action}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Next steps section */}
          {analysis.nextSteps && analysis.nextSteps.length > 0 && (
            <div className="next-steps">
              <h4>🎯 Next Steps</h4>
              <ol>
                {analysis.nextSteps.map((step, idx) => (
                  <li key={idx} className={`step-item priority-${step.priority}`}>
                    <strong>Step {step.step}:</strong> {step.action}
                    <span className="step-category">({step.category})</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="measure-qualified">
          <div className="success-message">✅ Patient qualifies for measure</div>
          
          {/* Show patient status even when qualified */}
          {analysis.patientStatus && (
            <div className="patient-status">
              <h4>📊 Patient Status</h4>
              <ul className="status-list">
                <li className={analysis.patientStatus.ageQualified ? 'qualified' : 'not-qualified'}>
                  Age Requirement: {analysis.patientStatus.ageQualified ? '✅' : '❌'}
                </li>
                <li className={analysis.patientStatus.visitQualified ? 'qualified' : 'not-qualified'}>
                  Visit Requirement: {analysis.patientStatus.visitQualified ? '✅' : '❌'}
                </li>
                <li className={analysis.patientStatus.hasScreening ? 'qualified' : 'not-qualified'}>
                  Screening Documented: {analysis.patientStatus.hasScreening ? '✅' : '❌'}
                </li>
              </ul>
              <div className="measure-status">
                <strong>Overall Status:</strong> {analysis.patientStatus.currentMeasureStatus}
              </div>
            </div>
          )}
          
          {/* Show recommendations even for qualified patients */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="qualified-recommendations">
              <h4>💡 Additional Opportunities</h4>
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className={`recommendation priority-${rec.priority}`}>
                  <div className="rec-message">{rec.message}</div>
                  <div className="rec-action">{rec.action}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MeasureAnalysis;