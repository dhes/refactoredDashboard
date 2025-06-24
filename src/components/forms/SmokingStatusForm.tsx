// SmokingStatusForm.tsx
import React, { useState } from "react";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";

const FHIR_SERVER = "http://localhost:8080/fhir";

interface SmokingStatusFormProps {
  patientId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

const smokingOptions = [
  { code: "266927001", display: "Current every day smoker" },
  { code: "8517006", display: "Former smoker" },
  { code: "266919005", display: "Never smoked tobacco" },
  { code: "266928000", display: "Unknown if ever smoked" },
];

const SmokingStatusForm: React.FC<SmokingStatusFormProps> = ({ patientId, onSubmit, onCancel }) => {
  const [smokingCode, setSmokingCode] = useState<string>("");

  const handleSubmit = async () => {
    const selectedOption = smokingOptions.find((o) => o.code === smokingCode);
    const observation = {
      resourceType: "Observation",
      status: "final",
      meta: {
        profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-smokingstatus"],
      },
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "social-history",
              display: "Social History",
            },
          ],
          text: "Social History",
        },
      ],
      code: {
        coding: [
          {
            code: "72166-2",
            system: "http://loinc.org",
            display: "Tobacco smoking status",
          },
        ],
        text: "Tobacco smoking status",
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      effectiveDateTime: new Date().toISOString(),
      valueCodeableConcept: {
        coding: [
          {
            code: smokingCode,
            system: "http://snomed.info/sct",
            display: selectedOption?.display || "",
          },
        ],
        text: selectedOption?.display || "",
      },
    };

    // Post to FHIR server if you want:
    try {
      const res = await fetch(`${FHIR_SERVER}/Observation`, {
        method: "POST",
        headers: { "Content-Type": "application/fhir+json" },
        body: JSON.stringify(observation),
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to POST Observation:", errorText);
        alert("Failed to save smoking status.");
        return;
      }
    } catch (err) {
      console.error("Error posting Observation:", err);
      alert("Failed to save smoking status.");
      return;
    }
    console.log("FHIR Smoking Observation:", observation);
    onSubmit();
  };

  return (
    <Box sx={{ p: 2, bg: "white", borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>
        Update Smoking Status
      </Typography>
      <FormControl fullWidth>
        <InputLabel id="smoking-status-label">Smoking Status</InputLabel>
        <Select
          labelId="smoking-status-label"
          value={smokingCode}
          label="Smoking Status"
          onChange={(e) => setSmokingCode(e.target.value as string)}
        >
          {smokingOptions.map((option) => (
            <MenuItem key={option.code} value={option.code}>
              {option.display}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ mt: 2, display: "flex" }}>
        <Button variant="contained" onClick={handleSubmit} disabled={!smokingCode}>
          Submit
        </Button>
        <Button variant="outlined" onClick={onCancel} sx={{ ml: 2 }}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default SmokingStatusForm;
