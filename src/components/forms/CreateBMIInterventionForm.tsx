// src/components/forms/CreateBMIInterventionForm.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import {
  INTERVENTION_TYPES,
  createBMIIntervention,
  validateBMIInterventionForm,
  type BMIInterventionFormData
} from '../../utils/bmiInterventionCreation';
import { fhirClient } from '../../services/fhirClient';
import type { Condition } from 'fhir/r4';

interface CreateBMIInterventionFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateBMIInterventionForm: React.FC<CreateBMIInterventionFormProps> = ({
  patientId,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<BMIInterventionFormData>>({
    date: new Date().toISOString().split('T')[0], // Today's date
    time: new Date().toTimeString().slice(0, 5), // Current time
    interventionType: 'dietary-regime', // Default to only option
    conditionId: undefined
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loadingConditions, setLoadingConditions] = useState(true);

  // Fetch patient's active Conditions on mount
  useEffect(() => {
    const fetchConditions = async () => {
      try {
        const allConditions = await fhirClient.getConditions(patientId);

        // Filter for active BMI-related conditions (Overweight, Obese, Underweight)
        const bmiConditions = allConditions.filter(condition => {
          const isActive = condition.clinicalStatus?.coding?.some(
            c => c.code === 'active'
          );
          const isBMIRelated = condition.code?.coding?.some(coding =>
            coding.system === 'http://hl7.org/fhir/sid/icd-10-cm' && (
              coding.code?.startsWith('E66') || // Overweight/Obesity codes
              coding.code === 'E46' // Malnutrition/Underweight
            )
          );
          return isActive && isBMIRelated;
        });

        setConditions(bmiConditions);

        // Auto-select if only one condition
        if (bmiConditions.length === 1 && bmiConditions[0].id) {
          setFormData(prev => ({ ...prev, conditionId: bmiConditions[0].id }));
        }
      } catch (error) {
        console.error('Failed to fetch conditions:', error);
        setErrors(['Failed to load conditions. You may proceed without selecting one.']);
      } finally {
        setLoadingConditions(false);
      }
    };

    fetchConditions();
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateBMIInterventionForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      await createBMIIntervention(patientId, formData as BMIInterventionFormData);
      setSuccessMessage('BMI intervention recorded successfully!');

      // Call onSuccess callback after a brief delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (error) {
      setErrors([`Failed to create intervention: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">⚖️ Record High BMI Follow-Up</h3>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-800 font-medium">✅ {successMessage}</div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 font-medium">⚠️ Please fix the following errors:</div>
            <ul className="list-disc list-inside mt-2">
              {errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Intervention Type - Currently only one option */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Intervention Provided <span className="text-red-500">*</span>
            </label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="font-medium">
                {INTERVENTION_TYPES['dietary-regime'].display}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                SNOMED CT: {INTERVENTION_TYPES['dietary-regime'].code}
              </div>
            </div>
          </div>

          {/* Condition Reference */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Related Diagnosis {conditions.length > 0 && <span className="text-red-500">*</span>}
            </label>
            {loadingConditions ? (
              <div className="p-3 bg-gray-50 border rounded">
                <div className="text-sm text-gray-600">Loading conditions...</div>
              </div>
            ) : conditions.length > 0 ? (
              <>
                <select
                  value={formData.conditionId || ''}
                  onChange={(e) => setFormData({ ...formData, conditionId: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">-- Select Diagnosis --</option>
                  {conditions.map((condition) => {
                    const code = condition.code?.coding?.[0];
                    const display = code?.display || condition.code?.text || 'Unknown';
                    const codeText = code?.code || '';
                    return (
                      <option key={condition.id} value={condition.id}>
                        {codeText} - {display}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the diagnosis that this intervention addresses
                </p>
              </>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-sm text-yellow-800">
                  ⚠️ No active BMI-related diagnoses found. You should add a diagnosis (E66.3, E66.811, etc.)
                  to the problem list before recording an intervention.
                </div>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Date Performed <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Time Performed (optional)
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Defaults to current time if not specified</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Recording...' : 'Record Intervention'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Helpful Information */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>💡 Note:</strong> This records that you provided dietary counseling or regime therapy
            to address the patient's BMI-related diagnosis. The intervention will reference the selected
            diagnosis from the problem list. This satisfies the CMS69 measure Numerator requirement.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateBMIInterventionForm;
