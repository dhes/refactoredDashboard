// src/components/forms/CreateBMIForm.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import {
  type BMIFormData,
  createBMIObservations,
  validateBMIForm,
  calculateBMI,
  convertHeightToCm,
  convertWeightToKg,
  getBMICategory
} from '../../utils/bmiObservationCreation';

interface CreateBMIFormProps {
  patientId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateBMIForm: React.FC<CreateBMIFormProps> = ({
  patientId,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<BMIFormData>>({
    date: new Date().toISOString().split('T')[0], // Today's date
    time: new Date().toTimeString().slice(0, 5), // Current time
    height: undefined,
    heightUnit: 'inches',
    weight: undefined,
    weightUnit: 'lbs'
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [liveBMI, setLiveBMI] = useState<{ bmi: number; category: string; categoryColor: string } | null>(null);

  // Calculate BMI live as user enters height and weight
  useEffect(() => {
    if (formData.height && formData.weight && formData.height > 0 && formData.weight > 0) {
      const heightCm = convertHeightToCm(formData.height, formData.heightUnit || 'inches');
      const weightKg = convertWeightToKg(formData.weight, formData.weightUnit || 'lbs');
      const bmi = calculateBMI(heightCm, weightKg);
      const result = getBMICategory(bmi);
      setLiveBMI(result);
    } else {
      setLiveBMI(null);
    }
  }, [formData.height, formData.weight, formData.heightUnit, formData.weightUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateBMIForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      await createBMIObservations(patientId, formData as BMIFormData);
      setSuccessMessage('BMI observations created successfully!');

      // Call onSuccess callback after a brief delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (error) {
      setErrors([`Failed to create BMI observations: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold mb-4">⚖️ Record BMI Screening</h3>

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

        {/* Live BMI Display */}
        {liveBMI && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-gray-800">
                {liveBMI.bmi.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">kg/m²</div>
              <div className={`text-sm px-3 py-1 rounded-full font-medium ${liveBMI.categoryColor}`}>
                {liveBMI.category}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Date <span className="text-red-500">*</span>
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
              Time (optional)
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Defaults to current time if not specified</p>
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Height <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={formData.height || ''}
                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                className="flex-1 border rounded px-3 py-2"
                placeholder="Enter height"
                required
              />
              <select
                value={formData.heightUnit}
                onChange={(e) => setFormData({ ...formData, heightUnit: e.target.value as 'inches' | 'cm' })}
                className="border rounded px-3 py-2"
              >
                <option value="inches">inches</option>
                <option value="cm">cm</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.heightUnit === 'inches' ? 'Valid range: 48-96 inches' : 'Valid range: 122-244 cm'}
            </p>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Weight <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={formData.weight || ''}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                className="flex-1 border rounded px-3 py-2"
                placeholder="Enter weight"
                required
              />
              <select
                value={formData.weightUnit}
                onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value as 'lbs' | 'kg' })}
                className="border rounded px-3 py-2"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.weightUnit === 'lbs' ? 'Valid range: 80-500 lbs' : 'Valid range: 36-227 kg'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Record BMI'}
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
            <strong>💡 Note:</strong> This will create three observations: height (LOINC 8302-2),
            weight (LOINC 29463-7), and BMI (LOINC 39156-5). All values are stored in metric units.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateBMIForm;
