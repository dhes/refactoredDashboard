import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { usePatient } from "../../hooks/usePatient";
import { useObservations } from "../../hooks/useObservations";
import { useEncounters } from "../../hooks/useEncounters";
import { useAvailablePatients } from "../../hooks/useAvailablePatients";
import { fhirClient } from "../../services/fhirClient";
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
import { usePatientAge } from "../../hooks/usePatientAge";
import { formatAgeDisplay } from "../../utils/ageCalculation";
import { getCodeSystem, getCodeDisplay } from "../../utils/medicalCodes";
import { getDisplayText, getCodingDisplay, formatQuantity } from "../../utils/fhirFormatters";
import { groupProceduresByDate, groupObservationsByDate } from "../../utils/dataGrouping";
import { EncounterPane } from "./EncounterPane";
import { MedicationRequestPane } from "./MedicationRequestPane";
import { ServiceRequestPane } from "./ServiceRequestPane";
import { EnhancedHospicePane } from "./EnhancedHospicePane";
import { SmokingStatusCard } from "./SmokingStatusCard";
import { CMS138PractitionerCard } from "./CMS138PractitionerCard";
import { CMS138DeveloperCard } from "./CMS138DeveloperCard";
import { QualifyingEncountersCard } from "./QualifyingEncountersCard";
import { TobaccoCessationMedicationsCard } from "./TobaccoCessationMedicationsCard";
import { TobaccoStatusCard } from "./TobaccoStatusCard";
import { TobaccoCessationCounselingCard } from "./TobaccoCessationCounselingCard";
import { AllGoalsMetCard } from "./AllGoalsMetCard";
import { useMeasurementPeriod } from "../../contexts/MeasurementPeriodContext";
import { useCMS138Evaluation } from "../../hooks/useCMS138Evaluation";

const Dashboard = () => {
  // State for selected patient - THIS ONE YOU NEED TO KEEP!
  const [selectedPatientId, setSelectedPatientId] = useState<string>("minimal-test");

  // Use all the hooks with proper destructuring
  const { patients: availablePatients, loading: patientsLoading } = useAvailablePatients();
  const { patient, loading: patientLoading, error: patientError } = usePatient(selectedPatientId);
  const { encounters, hasRecentEncounter, loading: encLoading } = useEncounters(selectedPatientId);
  const { allergies, loading: allergiesLoading } = useAllergies(selectedPatientId);
  const { conditions, loading: conditionsLoading } = useConditions(selectedPatientId);
  const { medications, loading: medicationsLoading } = useMedications(selectedPatientId);
  const { familyHistories, loading: familyLoading } = useFamilyHistory(selectedPatientId);
  const { immunizations, loading: immunizationsLoading } = useImmunizations(selectedPatientId);
  const { procedures, loading: proceduresLoading } = useProcedures(selectedPatientId);
  const { labs, loading: labsLoading } = useLabs(selectedPatientId);
  const { ageResult, loading: ageLoading } = usePatientAge(selectedPatientId, patient?.birthDate);
  const { measurementPeriod } = useMeasurementPeriod();
  const {
    cms138Result,
    loading: cms138Loading,
    error: cms138Error,
  } = useCMS138Evaluation(selectedPatientId);

  const isLoading = patientLoading || encLoading;

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
      {/* {selectedPatientId && (
        <MeasureAnalysis
          measureId="CMS138FHIRPreventiveTobaccoCessation"
          patientId={selectedPatientId}
        />
      )} */}
      {patient && (
        <div className="mb-4 p-4 bg-white shadow rounded">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold">
                {patient.name?.[0]?.given?.join(" ")} {patient.name?.[0]?.family}
              </span>
              <span>DOB: {patient.birthDate}</span>
              <span>Gender: {patient.gender}</span>
              {ageLoading ? (
                <span className="animate-pulse">Age: Calculating...</span>
              ) : ageResult ? (
                <span>Age: {formatAgeDisplay(ageResult.currentAge!, ageResult.mpStartAge!)}</span>
              ) : patient.birthDate ? (
                <span>
                  Age: {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} years
                </span>
              ) : null}
            </div>
            <div className="text-sm text-gray-600">
              {measurementPeriod.isRealTime ? "Real Time" : `MP ${measurementPeriod.year}`}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Smoking Status 
        <SmokingStatusCard patientId={selectedPatientId} />*/}

        {/* Tobacco Status (CQL-driven) */}
        <TobaccoStatusCard
          patientId={selectedPatientId}
          cms138Result={cms138Result}
          loading={cms138Loading}
          error={cms138Error}
        />

        {/* Tobacco Cessation Counseling - shows CQL-filtered counseling procedures */}
        <TobaccoCessationCounselingCard
          patientId={selectedPatientId}
          cms138Result={cms138Result}
          loading={cms138Loading}
          error={cms138Error}
        />

        {/* All Goals Met - shows when tobacco screening is complete */}
        <AllGoalsMetCard 
          patientId={selectedPatientId}
          cms138Result={cms138Result}
          loading={cms138Loading}
          error={cms138Error}
        />

        {/* Enhanced Hospice Status */}
        <EnhancedHospicePane patientId={selectedPatientId} />

        {/* CMS138 Practitioner Alert - only shows when intervention needed */}
        <CMS138PractitionerCard
          patientId={selectedPatientId}
          cms138Result={cms138Result}
          loading={cms138Loading}
          error={cms138Error}
        />

        {/* Qualifying Encounters - shows CQL-filtered encounters */}
        <QualifyingEncountersCard
          patientId={selectedPatientId}
          cms138Result={cms138Result}
          loading={cms138Loading}
          error={cms138Error}
        />

        {/* Tobacco Cessation Medications - shows CQL-filtered medications */}
        <TobaccoCessationMedicationsCard
          patientId={selectedPatientId}
          cms138Result={cms138Result}
          loading={cms138Loading}
          error={cms138Error}
        />

        {/* CMS138 Developer View - shows complete measure evaluation */}
        <CMS138DeveloperCard
          patientId={selectedPatientId}
          cms138Result={cms138Result}
          loading={cms138Loading}
          error={cms138Error}
        />

        {/* Recent Encounters */}
        <EncounterPane patientId={selectedPatientId} />

        {/* Medication Requests */}
        <MedicationRequestPane patientId={selectedPatientId} />

        {/* Service Requests */}
        <ServiceRequestPane patientId={selectedPatientId} />

        {allergies.length > 0 && (
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
        )}
        {conditions.length > 0 && (
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
        )}
        {medications.length > 0 && (
          <Card>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
        {labs.length > 0 && (
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
        )}
        {procedures.length > 0 && (
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

                            // Get the primary code for display
                            const primaryCode = p.code?.coding?.[0]?.code;
                            const codeSystem = p.code?.coding?.[0]?.system;
                            const codeDisplay = primaryCode
                              ? codeSystem
                                ? `${codeSystem.split("/").pop()}:${primaryCode}`
                                : primaryCode
                              : "";

                            return (
                              <li key={p.id}>
                                <div className="flex items-center gap-2">
                                  <span>{description}</span>
                                  {codeDisplay && (
                                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-mono">
                                      {codeDisplay}
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    );
                  })}
              </ul>
            </CardContent>
          </Card>
        )}
        {immunizations.length > 0 && (
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
        )}
        {familyHistories.length > 0 && (
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
        )}
      </div>
    </>
  );
};

export default Dashboard;
