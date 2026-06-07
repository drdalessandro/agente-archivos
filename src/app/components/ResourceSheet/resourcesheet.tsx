import React, { useState, useEffect } from "react";
import "../../Dashboard/dashboard.css";
import { Patient } from "@/libs/types";
import "./resource.css";
import { medplum } from "@/libs/medplumClient";
import { getDocumentType } from "@/libs/documentTypes";
import { Download } from "lucide-react";

interface ResourceSheetProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
  triggerRefetch: boolean;
  switchToResourceTab: boolean;
}

const ResourceSheet: React.FC<ResourceSheetProps> = ({
  patients,
  selectedPatient,
  setSelectedPatient,
  triggerRefetch,
  switchToResourceTab = false,
}) => {
  const [activeTab, setActiveTab] = useState<"list" | "resource">("list");
  const [resources, setResources] = useState<{
    documentReferences: any[];
    voiceRecordings: any[];
  }>({ documentReferences: [], voiceRecordings: [] });
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (switchToResourceTab && selectedPatient) {
      setActiveTab("resource");
    } else if (patients.length === 1) {
      setSelectedPatient(patients[0]);
      setActiveTab("resource");
    } else if (patients.length === 0) {
      setSelectedPatient(null);
      setActiveTab("list");
    }
  }, [patients, setSelectedPatient, switchToResourceTab, selectedPatient]);

  useEffect(() => {
    const fetchResources = async () => {
      if (selectedPatient) {
        const patientResources = await fetchPatientResources(selectedPatient.id!);
        setResources(patientResources);
      }
    };
    fetchResources();
  }, [selectedPatient, triggerRefetch]);

  const fetchPatientResources = async (patientId: string) => {
    try {
      const allDocumentReferencesResult = await medplum.search("DocumentReference", {
        subject: `Patient/${patientId}`,
      });

      const all = allDocumentReferencesResult.entry
        ? allDocumentReferencesResult.entry.map((entry: any) => entry.resource)
        : [];

      const documentReferences = all.filter(
        (doc: any) => doc.content?.[0]?.attachment?.contentType === "application/pdf"
      );

      const voiceRecordings = all.filter((doc: any) =>
        doc.content?.[0]?.attachment?.contentType?.startsWith("audio/")
      );

      return { documentReferences, voiceRecordings };
    } catch (error) {
      console.error("Error fetching patient resources:", error);
      return { documentReferences: [], voiceRecordings: [] };
    }
  };

  const handleViewPdf = async (binaryUrl: string, docId: string) => {
    setDownloading(docId);
    try {
      const blob = await medplum.download(binaryUrl);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank");
    } catch (_) {
      alert("No se pudo abrir el documento.");
    } finally {
      setDownloading(null);
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab("resource");
  };

  const patientName = selectedPatient?.name?.[0]
    ? `${selectedPatient.name[0].given[0]} ${selectedPatient.name[0].family}`
    : "";

  return (
    <div className="box resourcesSheet">
      <div className="tabs">
        <button
          onClick={() => setActiveTab("list")}
          className={activeTab === "list" ? "active" : ""}
        >
          Patient List
        </button>
        <button
          onClick={() => setActiveTab("resource")}
          className={activeTab === "resource" ? "active" : ""}
          disabled={!selectedPatient}
        >
          Patient Resources
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "list" && (
          <div className={`patient-list ${patients.length === 0 ? "empty" : ""}`}>
            {patients.length > 0 ? (
              <ul>
                {patients.map((patient) => (
                  <li
                    key={patient.id}
                    onClick={() => selectPatient(patient)}
                    className={selectedPatient?.id === patient.id ? "active" : ""}
                  >
                    <span className="patient-name">
                      {patient.name?.[0]?.given?.[0]} {patient.name?.[0]?.family}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No patients found</p>
            )}
          </div>
        )}

        {activeTab === "resource" && selectedPatient && (
          <div>
            <h3 className="resource_ptname">Paciente: {patientName}</h3>
            <div className="resourcesColumns">
              <div className="column pdf-column">
                <h4>Documentos médicos</h4>
                {resources.documentReferences.length === 0 ? (
                  <p className="rs-empty">Sin documentos</p>
                ) : (
                  <ul className="rs-docList">
                    {resources.documentReferences.map((file: any, index: number) => {
                      const coding = file.type?.coding?.[0];
                      const tipo = getDocumentType(coding?.code ?? "");
                      const binaryUrl = file.content?.[0]?.attachment?.url ?? "";
                      const title = file.content?.[0]?.attachment?.title ?? `Archivo ${index + 1}`;
                      const dateRaw = file.content?.[0]?.attachment?.creation;
                      const date = dateRaw
                        ? new Date(dateRaw).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "";

                      return (
                        <li key={index} className="rs-docItem">
                          <span className="rs-docIcon">{tipo.icon}</span>
                          <div className="rs-docInfo">
                            <span className="rs-docTitle">{title}</span>
                            <span className="rs-docType">{tipo.display}</span>
                            {date && <span className="rs-docDate">{date}</span>}
                          </div>
                          <button
                            className="rs-viewBtn"
                            onClick={() => handleViewPdf(binaryUrl, file.id ?? String(index))}
                            disabled={downloading === (file.id ?? String(index))}
                            title="Ver PDF"
                          >
                            <Download size={14} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="column audio-column">
                <h4>Grabaciones de voz</h4>
                <ul>
                  {resources.voiceRecordings.map((file: any, index: number) => (
                    <li key={index}>
                      <audio controls>
                        <source
                          src={file.content[0].attachment.url}
                          type="audio/webm"
                        />
                        {file.content[0].attachment.title || `Grabación ${index + 1}`}
                      </audio>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceSheet;
