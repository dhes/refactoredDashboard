import React from "react";
import { useMeasureLogicHighlighting } from "../../hooks/useMeasureLogicHighlighting";

interface Props {
  measureId: string;
  patientId: string;
}

export const MeasureLogicHighlighting: React.FC<Props> = ({ measureId, patientId }) => {
  console.log("MeasureLogicHighlighting rendered with:", { measureId, patientId });

  const { highlighting, loading, error } = useMeasureLogicHighlighting(measureId, patientId);

  console.log("Hook returned:", {
    highlighting: highlighting ? "exists" : "null",
    cleanHtmlLength: highlighting?.cleanHtml?.length || 0,
    loading,
    error,
  });

  if (loading)
    return <div className="p-4 bg-blue-50 rounded">⏳ Loading measure logic highlighting...</div>;
  if (error) return <div className="p-4 bg-red-50 rounded">❌ Error: {error}</div>;
  if (!highlighting)
    return <div className="p-4 bg-yellow-50 rounded">⚠️ No highlighting data available</div>;
  if (!highlighting.cleanHtml)
    return <div className="p-4 bg-yellow-50 rounded">⚠️ No HTML content found</div>;

  return (
    <div className="measure-logic-highlighting">
      <h3 className="text-lg font-semibold mb-2">🔍 Measure Logic Highlighting</h3>
      <div className="text-sm text-gray-600 mb-2">
        HTML length: {highlighting.cleanHtml.length} characters
      </div>
      <div
        className="highlighted-html border p-4 bg-white rounded overflow-auto max-h-96"
        dangerouslySetInnerHTML={{ __html: highlighting.cleanHtml }}
      />
    </div>
  );
};
