// src/components/forms/CreateConditionForm.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import {
  HIGH_BMI_CONDITION_CODES,
  LOW_BMI_CONDITION_CODES,
  createBMICondition,
  validateConditionForm,
  type ConditionFormData
} from '../../utils/conditionCreation';

interface CreateConditionFormProps {
  patientId: string;
  conditionType: 'high-bmi' | 'low-bmi';
  suggestedCode?: string | null; // Auto-select this code if provided
  bmiValue?: number | null; // Display the BMI value that triggered this
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateConditionForm: React.FC<CreateConditionFormProps> = ({
  patientId,
  conditionType,
  suggestedCode,
  bmiValue,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<ConditionFormData>>({
    onsetDate: new Date().toISOString().split('T')[0], // Today's date
    conditionCode: suggestedCode || '', // Use suggested code if provided
    category: 'problem-list-item'
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const conditionCodes = conditionType === 'high-bmi'
    ? HIGH_BMI_CONDITION_CODES
    : LOW_BMI_CONDITION_CODES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateConditionForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      await createBMICondition(patientId, formData as ConditionFormData);
      setSuccessMessage('Diagnosis added to problem list successfully!');

      // Call onSuccess callback after a brief delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (error) {
      setErrors([`Failed to create condition: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">
          📋 Add {conditionType === 'high-bmi' ? 'Overweight/Obesity' : 'Underweight'} Diagnosis
        </h3>

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

        {/* Show current BMI if provided */}
        {bmiValue && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Current BMI:</strong> {bmiValue.toFixed(1)} kg/m²
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Condition Code (Diagnosis) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Diagnosis <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.conditionCode}
              onChange={(e) => setFormData({ ...formData, conditionCode: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">-- Select Diagnosis --</option>
              {Object.entries(conditionCodes).map(([key, condition]) => (
                <option key={key} value={condition.code}>
                  {condition.code} - {condition.display}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.conditionCode && (() => {
                const code = conditionCodes[formData.conditionCode as keyof typeof conditionCodes];
                return code?.description || '';
              })()}
            </p>
          </div>

          {/* Onset Date */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Date Diagnosed <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.onsetDate}
              onChange={(e) => setFormData({ ...formData, onsetDate: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              When was this diagnosis first identified?
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Add to <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as 'problem-list-item' | 'health-concern' })}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="problem-list-item">Problem List</option>
              <option value="health-concern">Health Concern</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Problem List items are active diagnoses; Health Concerns are potential or preventive issues
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Diagnosis'}
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
            <strong>💡 Note:</strong> This adds the diagnosis to the patient's problem list,
            which allows you to record follow-up interventions (counseling, medication, etc.)
            that reference this condition. This is required before recording BMI interventions.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateConditionForm;
