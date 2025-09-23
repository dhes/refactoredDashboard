// src/utils/fhirFormatters.ts

/**
 * Extracts display text from FHIR CodeableConcept or Coding structures
 */
export const getDisplayText = (code: any): string => {
  if (!code) return "Unknown";
  return code.text || code.coding?.[0]?.display || code.coding?.[0]?.code || "Unknown";
};

/**
 * Gets display text from a coding array
 */
export const getCodingDisplay = (coding?: any[]): string => {
  if (!coding || coding.length === 0) return "Unknown";
  return coding[0].display || coding[0].code || "Unknown";
};

/**
 * Formats FHIR Quantity values with value and unit
 */
export const formatQuantity = (quantity: any): string => {
  if (!quantity) return "";
  const value = quantity.value || "";
  const unit = quantity.unit || quantity.code || "";
  return `${value} ${unit}`.trim();
};