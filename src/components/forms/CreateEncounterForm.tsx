// src/components/forms/CreateEncounterForm.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import {
  ENCOUNTER_TYPES,
  getReasonCodesForEncounter,
  createEncounter,
  validateEncounterForm,
  type EncounterFormData
} from '../../utils/encounterCreation';

interface CreateEncounterFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateEncounterForm: React.FC<CreateEncounterFormProps> = ({
  patientId,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<EncounterFormData>>({
    encounterDate: new Date().toISOString().split('T')[0], // Today's date
    encounterTime: new Date().toTimeString().slice(0, 5), // Current time
    encounterType: '',
    reasonCode: ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleEncounterTypeChange = (encounterType: string) => {
    setFormData({
      ...formData,
      encounterType,
      reasonCode: '' // Reset reason code when encounter type changes
    });
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateEncounterForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      await createEncounter(patientId, formData as EncounterFormData);
      setSuccessMessage('Encounter created successfully!');

      // Call onSuccess callback after a brief delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (error) {
      setErrors([`Failed to create encounter: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableReasonCodes = formData.encounterType
    ? getReasonCodesForEncounter(formData.encounterType)
    : [];

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">📅 Create Qualifying Encounter</h3>

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
          {/* Encounter Date */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Encounter Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.encounterDate}
              onChange={(e) => setFormData({ ...formData, encounterDate: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Encounter Time */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Encounter Time (optional)
            </label>
            <input
              type="time"
              value={formData.encounterTime}
              onChange={(e) => setFormData({ ...formData, encounterTime: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Defaults to 08:00 if not specified</p>
          </div>

          {/* Encounter Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Encounter Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.encounterType}
              onChange={(e) => handleEncounterTypeChange(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">-- Select Encounter Type --</option>
              <optgroup label="Office Visits">
                {Object.entries(ENCOUNTER_TYPES)
                  .filter(([_, type]) => type.category === 'office')
                  .map(([key, type]) => (
                    <option key={key} value={key}>
                      {type.display} (CPT {type.cpt})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Preventive Care">
                {Object.entries(ENCOUNTER_TYPES)
                  .filter(([_, type]) => type.category === 'preventive')
                  .map(([key, type]) => (
                    <option key={key} value={key}>
                      {type.display} (CPT {type.cpt})
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Reason Code (ICD-10) */}
          {formData.encounterType && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Reason for Visit (ICD-10) <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.reasonCode}
                onChange={(e) => setFormData({ ...formData, reasonCode: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">-- Select Reason Code --</option>
                {availableReasonCodes.map((reason) => (
                  <option key={reason.code} value={reason.code}>
                    {reason.code} - {reason.display}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Encounter'}
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
            <strong>💡 Note:</strong> This encounter will qualify the patient for BMI screening evaluation.
            The encounter type and reason code are selected to meet CMS69 measure requirements.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateEncounterForm;