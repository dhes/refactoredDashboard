// src/components/forms/CreateBMIInterventionForm.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import {
  INTERVENTION_TYPES,
  BMI_REASON_CODES,
  createBMIIntervention,
  validateBMIInterventionForm,
  type BMIInterventionFormData
} from '../../utils/bmiInterventionCreation';

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
    reasonCode: '162863004' // Default to overweight (25-29)
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

          {/* Reason Code (Diagnosis) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Reason for Intervention <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.reasonCode}
              onChange={(e) => setFormData({ ...formData, reasonCode: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">-- Select Reason --</option>
              {Object.entries(BMI_REASON_CODES).map(([key, reason]) => (
                <option key={key} value={reason.code}>
                  {reason.display} ({reason.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the diagnosis that applies to this patient
            </p>
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
            to address the patient's high BMI. This satisfies the CMS69 measure Numerator requirement.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateBMIInterventionForm;
