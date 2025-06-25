import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { usePatient } from "../../hooks/usePatient";
import { useMeasureReports } from "../../hooks/useMeasureReports";
import { useObservations } from "../../hooks/useObservations";
import { useEncounters } from "../../hooks/useEncounters";
import { useAvailablePatients } from "../../hooks/useAvailablePatients";
import { fhirClient } from "../../services/fhirClient";
import SmokingStatusForm from "../forms/SmokingStatusForm";
import { useAllergies } from "../../hooks/useAllergies";
import type { AllergyIntolerance, Condition, Procedure, Observation } from "../../types/fhir";
import { useConditions } from "../../hooks/useConditions";
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import type { MedicationStatement } from "../../types/fhir";
import { useMedications } from "../../hooks/useMedications";
import { useFamilyHistory } from "../../hooks/useFamilyHistory";
import { useImmunizations } from "../../hooks/useImmunizations";
import { useProcedures } from "../../hooks/useProcedures";
import { useLabs } from "../../hooks/useLabs";
import { useSmokingStatus } from "../../hooks/useSmokingStatus";

const Dashboard = () => {
  // State for selected patient - THIS ONE YOU NEED TO KEEP!
  const [selectedPatientId, setSelectedPatientId] = useState<string>("minimal-test");
  // const [showEncounterForm, setShowEncounterForm] = useState<boolean>(false);
  // Add all the form-related state
  const [showEncounterForm, setShowEncounterForm] = useState<boolean>(false);
  const [encounterDate, setEncounterDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [icd10, setIcd10] = useState<string>("");
  const [cpt, setCpt] = useState<string>("");
  const [showSmokingStatusPrompt, setShowSmokingStatusPrompt] = useState<boolean>(false);
  const [showSmokingForm, setShowSmokingForm] = useState<boolean>(false);

  // Use all the hooks with proper destructuring
  const { patients: availablePatients, loading: patientsLoading } = useAvailablePatients();
  const { patient, loading: patientLoading, error: patientError } = usePatient(selectedPatientId);
  const { measureReports, loading: reportsLoading } = useMeasureReports(selectedPatientId);
  // const { observations, smokingStatus, loading: obsLoading } = useObservations(selectedPatientId);
  const { encounters, hasRecentEncounter, loading: encLoading } = useEncounters(selectedPatientId);
  const { allergies, loading: allergiesLoading } = useAllergies(selectedPatientId);
  const { conditions, loading: conditionsLoading } = useConditions(selectedPatientId);
  const { medications, loading: medicationsLoading } = useMedications(selectedPatientId);
  const { familyHistories, loading: familyLoading } = useFamilyHistory(selectedPatientId);
  const { immunizations, loading: immunizationsLoading } = useImmunizations(selectedPatientId);
  const { procedures, loading: proceduresLoading } = useProcedures(selectedPatientId);
  const { labs, loading: labsLoading } = useLabs(selectedPatientId);
  const { smokingStatus, allSmokingObs } = useSmokingStatus(selectedPatientId);

  // Add this with your other logic, after the hooks
  // const psaReminder = useMemo(() => {
  //   if (!patient || !observations) return "";

  //   // Check if patient needs PSA test
  //   const age = patient.birthDate ?
  //     new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : 0;

  //   const isMale = patient.gender === 'male';

  //   // Check for recent PSA test (you'll need to adjust the code based on your PSA observation codes)
  //   const recentPSA = observations.some(obs => {
  //     const isPSA = obs.code?.coding?.some(c =>
  //       c.code === '2857-1' && c.system === 'http://loinc.org' // LOINC code for PSA
  //     );
  //     if (!isPSA) return false;

  //     const obsDate = new Date(obs.effectiveDateTime || '');
  //     const oneYearAgo = new Date();
  //     oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  //     return obsDate > oneYearAgo;
  //   });

  //   // PSA screening typically recommended for men over 50
  //   if (isMale && age >= 50 && !recentPSA) {
  //     return "Order PSA Test: Patient has not had a PSA test in the past year";
  //   }

  //   return "";
  // }, [patient, observations]);

  // Get the latest smoking observation
  const latestSmokingObservation = smokingStatus;
  // NOW you can do the console.log
  console.log("Smoking status data:", {
    smokingStatus,
    allSmokingObs,
    selectedPatientId,
    latestSmokingObservation,
  });
  // .filter(obs => obs.code?.coding?.some(c =>
  //   c.code === '72166-2' && c.system === 'http://loinc.org'
  // ))
  // .sort((a, b) => {
  //   const dateA = a.effectiveDateTime || '';
  //   const dateB = b.effectiveDateTime || '';
  //   return dateB.localeCompare(dateA);
  // })[0]

  // Add the debug useEffect here
  // Update your debug code to also log smokingStatus from the hook
  // useEffect(() => {
  //   const smokingObs = observations.filter(obs =>
  //     obs.code?.coding?.some(c =>
  //       c.code === '72166-2' && c.system === 'http://loinc.org'
  //     )
  //   );
  //   console.log('All observations count:', observations.length);
  //   console.log('All smoking observations:', smokingObs);
  //   console.log('Latest smoking observation:', latestSmokingObservation);
  //   console.log('Smoking status from hook:', smokingStatus); // Add this
  // }, [observations, latestSmokingObservation, smokingStatus]);

  const formatQuantity = (quantity: any): string => {
    if (!quantity) return "";
    const value = quantity.value || "";
    const unit = quantity.unit || quantity.code || "";
    return `${value} ${unit}`.trim();
  };

  // Add the handler for "No Change" button
  const handleNoChangeSmokingStatus = async (previousObservation: any) => {
    try {
      // Create a new observation with today's date but same value
      const newObservation = {
        resourceType: "Observation" as const,
        status: "final" as const,
        code: previousObservation.code,
        subject: {
          reference: `Patient/${selectedPatientId}`,
        },
        effectiveDateTime: new Date().toISOString(),
        valueCodeableConcept: previousObservation.valueCodeableConcept,
      };

      await fhirClient.createObservation(newObservation);

      // Close the prompt
      setShowSmokingStatusPrompt(false);

      // TODO: Refresh observations to show the new one
    } catch (error) {
      console.error("Error updating smoking status:", error);
    }
  };

  // Check if smoking status prompt should be shown (example logic)
  // useEffect(() => {
  //   if (latestSmokingObservation) {
  //     const lastRecordedDate = new Date(latestSmokingObservation.effectiveDateTime || "");
  //     const oneYearAgo = new Date();
  //     oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  //     if (lastRecordedDate < oneYearAgo) {
  //       setShowSmokingStatusPrompt(true);
  //     }
  //   }
  // }, [latestSmokingObservation]);

  // Update your useEffect to add more logging:
  useEffect(() => {
    console.log("Smoking status check:", {
      hasSmokingStatus: !!latestSmokingObservation,
      effectiveDateTime: latestSmokingObservation?.effectiveDateTime,
      showPrompt: showSmokingStatusPrompt,
    });

    if (latestSmokingObservation && latestSmokingObservation.effectiveDateTime) {
      const lastRecordedDate = new Date(latestSmokingObservation.effectiveDateTime);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      console.log("Date comparison:", {
        lastRecorded: lastRecordedDate.toISOString(),
        oneYearAgo: oneYearAgo.toISOString(),
        shouldShowPrompt: lastRecordedDate < oneYearAgo,
      });

      if (lastRecordedDate < oneYearAgo) {
        setShowSmokingStatusPrompt(true);
      }
    } else {
      console.log("No smoking observation or no effectiveDateTime");
    }
  }, [latestSmokingObservation]);

  // Add the form submit handler
  const handleEncounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create the encounter using your FHIR client
      const encounter = {
        resourceType: "Encounter" as const,
        status: "finished" as const,
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "AMB",
          display: "ambulatory",
        },
        type: [
          {
            coding: [
              {
                system: "http://www.ama-assn.org/go/cpt",
                code: cpt,
                display: "Selected CPT",
              },
            ],
          },
        ],
        subject: {
          reference: `Patient/${selectedPatientId}`,
        },
        period: {
          start: encounterDate,
          end: encounterDate,
        },
        reasonCode: [
          {
            coding: [
              {
                system: "http://hl7.org/fhir/sid/icd-10-cm",
                code: icd10,
                display: "Selected ICD-10",
              },
            ],
          },
        ],
      };

      // Import fhirClient at the top of your file
      await fhirClient.createEncounter(encounter);

      // Reset form and close
      setShowEncounterForm(false);
      setIcd10("");
      setCpt("");

      // TODO: Refresh the measure reports to show updated results
    } catch (error) {
      console.error("Error creating encounter:", error);
      // TODO: Show error message to user
    }
  };

  // NOW the combined loading state will work
  const isLoading = patientLoading || reportsLoading || encLoading;

  // Remove these duplicate/incomplete hook calls:
  // const { patient: hookPatient, loading: hookLoading } = usePatient(selectedPatientId);
  // const { measureReports, loading: reportsLoading } = useMeasureReports(selectedPatientId);

  // Get the first measure report from the array
  const measureReport = measureReports[0];

  // Add these helper functions
  const getDisplayText = (code: any): string => {
    if (!code) return "Unknown";
    return code.text || code.coding?.[0]?.display || code.coding?.[0]?.code || "Unknown";
  };

  // Add this helper function in Dashboard.tsx with your other helpers
  const groupProceduresByDate = (procedures: Procedure[]): Record<string, Procedure[]> => {
    const grouped: Record<string, Procedure[]> = {};

    procedures.forEach((proc) => {
      const date =
        proc.performedDateTime?.slice(0, 10) ||
        proc.performedPeriod?.start?.slice(0, 10) ||
        "Unknown Date";

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(proc);
    });

    return grouped;
  };

  // Add this helper function with your other helpers

  const groupObservationsByDate = (observations: Observation[]): Record<string, Observation[]> => {
    const grouped: Record<string, Observation[]> = {};

    observations.forEach((obs) => {
      const date =
        obs.effectiveDateTime?.slice(0, 10) ||
        obs.effectivePeriod?.start?.slice(0, 10) ||
        "Unknown Date";

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(obs);
    });

    return grouped;
  };

  const getCodingDisplay = (coding?: any[]): string => {
    if (!coding || coding.length === 0) return "Unknown";
    return coding[0].display || coding[0].code || "Unknown";
  };

  // Your return statement...
  return (
    <>
      <div className="mb-4 p-4 bg-gray-50 border rounded">
        <label className="block font-medium mb-1">Select Patient</label>
        <select
          className="border p-2 rounded w-full"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          {availablePatients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name?.[0]?.given?.join(" ")} {p.name?.[0]?.family} ({p.id})
            </option>
          ))}
        </select>
      </div>
      {/* PSA Reminder - commented out for now
      {psaReminder && (
        <div className="mb-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <p className="font-semibold">🔔 Reminder</p>
          <p>{psaReminder}</p>
        </div>
      )*/}
      {measureReport && (
        <div className="mb-4 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700">
          <h2 className="text-xl font-semibold mb-2">📊 Tobacco Cessation Measure Report</h2>
          <p className="mb-2">
            <strong>Status:</strong> {measureReport.status}
          </p>
          <p className="mb-2">
            <strong>Measurement Period:</strong> {measureReport.period?.start?.slice(0, 10)} to{" "}
            {measureReport.period?.end?.slice(0, 10)}
          </p>
          {measureReport.group?.map((group: any, i: number) => (
            <div key={i} className="mb-2">
              <h3 className="font-bold">Group {i + 1}</h3>
              <ul className="ml-4 list-disc">
                {group.population?.map((pop: any, j: number) => (
                  <li key={j}>
                    {pop.code?.coding?.[0]?.display ?? "Unknown"}: {pop.count}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {measureReport?.group?.every((group: any) =>
            group.population.every((pop: any) => pop.count === 0)
          ) && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-300 text-blue-800 rounded">
              <p className="mb-2">
                This patient has no qualifying encounters documented in 2025. Would you like to
                create a qualifying office visit now to ensure they are counted in this measure?
              </p>
              <button
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setShowEncounterForm(true)}
              >
                Create Encounter
              </button>
            </div>
          )}
        </div>
      )}
      {showEncounterForm && (
        <div className="mb-4 p-4 border rounded bg-white shadow">
          <h3 className="text-lg font-semibold mb-2">📝 New Encounter Form</h3>
          <form onSubmit={handleEncounterSubmit}>
            <div className="mb-2">
              <label className="block font-medium">Encounter Date</label>
              <input
                type="date"
                className="border p-1 rounded w-full"
                value={encounterDate}
                onChange={(e) => setEncounterDate(e.target.value)}
              />
            </div>
            <div className="mb-2">
              <label className="block font-medium">ICD-10-CM Code</label>
              <select
                className="border p-1 rounded w-full"
                value={icd10}
                onChange={(e) => setIcd10(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="Z00.00">
                  Z00.00 - General adult medical exam without abnormal findings
                </option>
                <option value="Z00.01">
                  Z00.01 - General adult medical exam with abnormal findings
                </option>
                <option value="Z00.121">Z00.121 - Well child visit, 12-17 years</option>
                <option value="Z00.129">Z00.129 - Well child visit, NOS</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="block font-medium">CPT Code</label>
              <select
                className="border p-1 rounded w-full"
                value={cpt}
                onChange={(e) => setCpt(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="99384">99384 - Initial preventive visit, 12-17 years</option>
                <option value="99385">99385 - Initial preventive visit, 18-39 years</option>
                <option value="99394">99394 - Periodic preventive visit, 12-17 years</option>
                <option value="99395">99395 - Periodic preventive visit, 18-39 years</option>
                <option value="G0438">G0438 - Initial Annual Wellness Visit</option>
                <option value="G0439">G0439 - Subsequent Annual Wellness Visit</option>
              </select>
            </div>
            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit
            </button>
            <button
              type="button"
              className="mt-2 ml-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              onClick={() => setShowEncounterForm(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
      {patient && (
        <div className="mb-4 p-4 bg-white shadow rounded">
          <h2 className="text-xl font-semibold">👤 Patient</h2>
          <p>
            {patient.name?.[0]?.given?.join(" ")} {patient.name?.[0]?.family}
          </p>
          <p>DOB: {patient.birthDate}</p>
          <p>Gender: {patient.gender}</p>
        </div>
      )}

      {/*Smoking Status Card - Always visible*/}
      {/* <div className="mb-4 p-4 bg-white shadow rounded">
        <h2 className="text-xl font-semibold mb-2">🚭 Smoking Status</h2> */}
        {/* {smokingStatus ? (
          <div>
            <p className="text-lg">
              {smokingStatus.valueCodeableConcept?.coding?.[0]?.display ||
                smokingStatus.valueCodeableConcept?.text ||
                "Unknown status"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Last updated: {smokingStatus.effectiveDateTime?.slice(0, 10) || "Date unknown"}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 italic">No smoking history on file</p>
        )} */}

        {/* Optional: Add an update button if status is old or missing */}
        {/* {(!smokingStatus ||
          (smokingStatus.effectiveDateTime &&
            new Date(smokingStatus.effectiveDateTime) <
              new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))) && (
          <button
            onClick={() => setShowSmokingForm(true)}
            className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update Smoking Status
          </button>
        )}
      </div>

      Debug info - remove after testing */}
      {/* <div className="mb-2 p-2 bg-gray-100 text-xs">
        Debug: showSmokingStatusPrompt = {String(showSmokingStatusPrompt)}, hasSmokingObs ={" "}
        {String(!!latestSmokingObservation)}, effectiveDate ={" "}
        {latestSmokingObservation?.effectiveDateTime || "none"}
      </div>
      {showSmokingStatusPrompt && (
        <div className="mb-4 p-4 bg-orange-100 border-l-4 border-orange-500 text-orange-800 rounded">
          <p className="font-semibold mb-2">🚭 Smoking Status</p>
          <p className="italic mb-2">
            Last recorded smoking status:{" "}
            {latestSmokingObservation?.effectiveDateTime?.slice(0, 10)} —{" "}
            {latestSmokingObservation?.valueCodeableConcept?.text ??
              latestSmokingObservation?.valueCodeableConcept?.coding?.[0]?.display}
          </p>
          <p>
            The last documented smoking status is over a year old. Has anything changed in the
            patient's tobacco use since then?
          </p>
          <div className="mt-2 space-x-2">
            <button
              onClick={() => handleNoChangeSmokingStatus(latestSmokingObservation)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              No Change
            </button>
            <button
              onClick={() => {
                setShowSmokingStatusPrompt(false);
                setShowSmokingForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Yes — Update
            </button>
            <button
              onClick={() => setShowSmokingStatusPrompt(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showSmokingForm && (
        <SmokingStatusForm
          patientId={selectedPatientId}
          onSubmit={() => setShowSmokingForm(false)}
          onCancel={() => setShowSmokingForm(false)}
        />
      )} */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Smoking Status Prompt, shown if needed */}
        <Card>
          <h3 className="font-semibold text-lg mb-2">🚭 Smoking Status</h3>
          {smokingStatus ? (
            <div>
              <p className="text-lg">
                {smokingStatus.valueCodeableConcept?.coding?.[0]?.display ||
                  smokingStatus.valueCodeableConcept?.text ||
                  "Unknown status"}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Last updated: {smokingStatus.effectiveDateTime?.slice(0, 10) || "Date unknown"}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 italic">No smoking history on file</p>
          )}

          {/* Optional: Add an update button if status is old or missing */}
          {(!smokingStatus ||
            (smokingStatus.effectiveDateTime &&
              new Date(smokingStatus.effectiveDateTime) <
                new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))) && (
            <button
              onClick={() => setShowSmokingForm(true)}
              className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Update Smoking Status
            </button>
          )}
        </Card>{" "}
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">⚠️ Allergies</h2>
            <ul>
              {allergies.map((a: AllergyIntolerance) => (
                <li key={a.id}>
                  {getDisplayText(a.code)}
                  {(() => {
                    const status = getCodingDisplay(a.clinicalStatus?.coding);
                    return status !== "Unknown" ? ` — ${status}` : "";
                  })()}
                  {/* {a.note?.[0]?.text ? ` — ${a.note[0].text}` : ""} */}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">🩺 Conditions</h2>
            <ul>
              {conditions.map((c: Condition) => (
                <li key={c.id}>
                  {getDisplayText(c.code)}
                  {(() => {
                    const status = getCodingDisplay(c.clinicalStatus?.coding);
                    return status !== "Unknown" ? ` — ${status}` : "";
                  })()}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <MuiCard>
          <MuiCardContent>
            <Typography variant="h6" gutterBottom>
              💊 Medications
            </Typography>
            <List dense>
              {medications.map((m: MedicationStatement, index) => (
                <React.Fragment key={m.id || index}>
                  <ListItem>
                    <ListItemText
                      primary={getDisplayText(m.medicationCodeableConcept)}
                      secondary={
                        m.dosage?.[0]?.doseAndRate?.[0]?.doseQuantity
                          ? `${formatQuantity(m.dosage[0].doseAndRate[0].doseQuantity)}`
                          : null
                      }
                    />
                  </ListItem>
                  {index < medications.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </MuiCardContent>
        </MuiCard>
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">🧪 Labs</h2>
            <ul>
              {Object.entries(groupObservationsByDate(labs))
                .sort(([a], [b]) => b.localeCompare(a)) // descending date order
                .map(([date, observations]) => (
                  <li key={date}>
                    <strong>{date}</strong>
                    <ul>
                      {observations.map((lab) => (
                        <li key={lab.id}>
                          {getDisplayText(lab.code)}: {formatQuantity(lab.valueQuantity)}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">🧾 Procedures</h2>
            <ul>
              {Object.entries(groupProceduresByDate(procedures))
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, procs]) => {
                  const byId = Object.fromEntries(
                    procs.filter((p) => p.id).map((p) => [`Procedure/${p.id!}`, p])
                  );
                  const childToParent: Record<string, string> = {};
                  procs.forEach((p) => {
                    if (p.id && p.partOf) {
                      p.partOf.forEach((po) => {
                        if (po.reference) {
                          childToParent[p.id!] = po.reference;
                        }
                      });
                    }
                  });

                  const parentGroups: Record<string, Procedure[]> = {};
                  procs.forEach((p) => {
                    const parentId = childToParent[p.id!];
                    if (p.id && parentId && byId[parentId]) {
                      if (!parentGroups[parentId]) parentGroups[parentId] = [];
                      parentGroups[parentId].push(p);
                    }
                  });

                  const shown = new Set<string>();
                  return (
                    <li key={date}>
                      <strong>{date}</strong>
                      <ul>
                        {procs.map((p) => {
                          if (!p.id) return null;
                          if (childToParent[p.id]) return null; // skip child here
                          shown.add(p.id);
                          const children = parentGroups[`Procedure/${p.id}`] || [];
                          const description = [
                            getDisplayText(p.code).replace(/\s*\(procedure\)$/i, ""),
                            ...children.map((c) =>
                              getDisplayText(c.code).replace(/\s*\(procedure\)$/i, "")
                            ),
                          ].join(" with ");
                          return <li key={p.id}>{description}</li>;
                        })}
                      </ul>
                    </li>
                  );
                })}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">💉 Immunizations</h2>
            <ul>
              {immunizations
                .sort((a, b) =>
                  (b.occurrenceDateTime || "").localeCompare(a.occurrenceDateTime || "")
                )
                .map((imm) => (
                  <li key={imm.id}>
                    {imm.occurrenceDateTime?.slice(0, 10)} —{" "}
                    {getDisplayText(imm.vaccineCode).slice(0, 60)}...
                    {imm.site?.coding?.[0]?.display ? ` — ${imm.site.coding[0].display}` : ""}
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">👪 Family History</h2>
            <ul>
              {familyHistories.map((fh) => (
                <li key={fh.id}>
                  {getDisplayText(fh.relationship).replace(
                    /\s*\((disorder|qualifier value)\)$/i,
                    ""
                  )}
                  :
                  <ul>
                    {fh.condition?.map((cond, index) => (
                      <li key={index}>
                        {getDisplayText(cond.code).replace(
                          /\s*\((disorder|qualifier value)\)$/i,
                          ""
                        )}
                        {cond.outcome?.coding?.[0]?.display
                          ? ` — ${cond.outcome.coding[0].display.replace(
                              /\s*\((disorder|qualifier value)\)$/i,
                              ""
                            )}`
                          : ""}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Dashboard;
