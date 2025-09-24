// src/components/dashboard/TobaccoCessationCounselingCard.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { useMeasurementPeriod } from '../../contexts/MeasurementPeriodContext';
import type { CMS138Result } from '../../utils/cms138Parser';

interface TobaccoCessationCounselingCardProps {
  patientId: string;
  cms138Result: CMS138Result | null;
  loading: boolean;
  error: Error | null;
}

export const TobaccoCessationCounselingCard: React.FC<TobaccoCessationCounselingCardProps> = ({ 
  patientId, 
  cms138Result, 
  loading, 
  error 
}) => {
  const [showCounseling, setShowCounseling] = useState(false);
  const { measurementPeriod } = useMeasurementPeriod();

  // Get counseling procedures from CQL evaluation
  const counselingProcedures = cms138Result?.tobaccoCessationCounseling || [];

  // Sort by performed date (most recent first)
  const sortedCounseling = counselingProcedures.sort((a, b) => {
    const dateA = a.performedDateTime || a.performedPeriod?.start || '';
    const dateB = b.performedDateTime || b.performedPeriod?.start || '';
    return dateB.localeCompare(dateA);
  });

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowCounseling(!showCounseling)}
          >
            <h3 className="text-lg font-semibold">💬 Tobacco Cessation Counseling</h3>
            <button className="text-xl font-bold">
              {showCounseling ? "▲" : "▼"}
            </button>
          </div>
          {showCounseling && (
            <div className="mt-4">
              <div className="animate-pulse">
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowCounseling(!showCounseling)}
          >
            <h3 className="text-lg font-semibold">💬 Tobacco Cessation Counseling</h3>
            <button className="text-xl font-bold">
              {showCounseling ? "▲" : "▼"}
            </button>
          </div>
          {showCounseling && (
            <div className="mt-4">
              <div className="text-red-600">
                Error loading tobacco cessation counseling: {error.message}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const formatMeasurementPeriod = () => 
    measurementPeriod.isRealTime ? 'Real Time' : measurementPeriod.year.toString();

  return (
    <Card>
      <CardContent>
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowCounseling(!showCounseling)}
        >
          <h3 className="text-lg font-semibold">💬 Tobacco Cessation Counseling</h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              {measurementPeriod.isRealTime ? 'Real Time' : `MP ${formatMeasurementPeriod()}`}: {sortedCounseling.length} counseling sessions
            </div>
            <button className="text-xl font-bold">
              {showCounseling ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {showCounseling && (
          <div className="mt-4">
            {sortedCounseling.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No tobacco cessation counseling found for this period
              </div>
            ) : (
              <div className="space-y-3">
                {sortedCounseling.map((procedure, index) => (
                  <TobaccoCounselingRow key={procedure.id || index} procedure={procedure} />
                ))}
              </div>
            )}

            {!measurementPeriod.isRealTime && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Measurement Period: {measurementPeriod.start} to {measurementPeriod.end}
                  <br />
                  <span className="italic">Counseling satisfies Patient Score requirements</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface TobaccoCounselingRowProps {
  procedure: any;
}

const TobaccoCounselingRow: React.FC<TobaccoCounselingRowProps> = ({ procedure }) => {
  const procedureDate = procedure.performedDateTime || procedure.performedPeriod?.start || '';
  const displayDate = procedureDate ? new Date(procedureDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'Unknown';
  
  // Get primary procedure coding
  const primaryCoding = procedure.code?.coding?.[0];
  const primaryCode = primaryCoding?.code || 'No code';
  const primaryDisplay = primaryCoding?.display || 'Unknown counseling type';

  // Format code display with system prefix
  const formatCodeDisplay = (coding: any) => {
    if (!coding?.code) return 'No code';
    
    const system = coding.system || '';
    const code = coding.code;
    
    if (system.includes('snomed.info/sct')) {
      return `SCT ${code}`;
    } else if (system.includes('ama-assn.org/go/cpt')) {
      return `CPT ${code}`;
    } else if (system.includes('cms.gov/Medicare/Coding/HCPCSReleaseCodeSets')) {
      return `HCPCS ${code}`;
    } else {
      return code;
    }
  };

  const formattedCode = formatCodeDisplay(primaryCoding);

  // Get status information
  const status = procedure.status || 'unknown';
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'not-done':
      case 'stopped':
        return 'bg-red-100 text-red-800';
      case 'preparation':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-3 rounded-lg border-l-4 border-l-blue-500 bg-blue-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium">{displayDate}</span>
            <span className="text-sm font-mono text-gray-600">{formattedCode}</span>
            {status !== 'unknown' && (
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)}`}>
                {status}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-700 mt-1 font-medium">
            {primaryDisplay}
          </div>
          {/* Show recorded date if available and different from performed date */}
          {procedure.extension?.find((ext: any) => ext.url?.includes('qicore-recorded'))?.valueDateTime && (
            <div className="text-xs text-gray-500 mt-1">
              Recorded: {new Date(procedure.extension.find((ext: any) => ext.url?.includes('qicore-recorded')).valueDateTime).toLocaleDateString('en-US', { timeZone: 'UTC' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TobaccoCessationCounselingCard;