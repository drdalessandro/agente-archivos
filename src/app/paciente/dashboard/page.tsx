"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Cloud, FileText, Download } from "lucide-react";
import { MedplumAppShell } from "../../components/MedplumAppShell/medplumappshell";
import { medplum } from "@/libs/medplumClient";
import { parseClientCookies } from "@/libs/cookies";
import { DOCUMENT_TYPES, LOINC_SYSTEM, getDocumentType } from "@/libs/documentTypes";
import "./paciente.css";
import "../../components/UploadDropZone/uploaddropzone.css";

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function sanitizeFileName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const ext = lastDot >= 0 ? name.slice(lastDot).toLowerCase() : "";
  const base = lastDot >= 0 ? name.slice(0, lastDot) : name;
  return (
    base
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_-]/g, "") + ext
  );
}

interface DocItem {
  id: string;
  title: string;
  typeCode: string;
  date: string;
  binaryUrl: string;
}

const PacienteDashboard = () => {
  const router = useRouter();
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<DocItem[]>([]);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const cookies = parseClientCookies();
      const token = cookies.medplumAccessToken;

      if (!token || cookies.medplumUserRole !== "patient") {
        router.push("/login");
        return;
      }

      medplum.setAccessToken(token);

      let pid = cookies.medplumPatientId || null;
      const email = cookies.medplumUserEmail || "";

      if (!pid && email) {
        try {
          const result = await medplum.search("Patient", { telecom: `email|${email}` });
          const found = result.entry?.[0]?.resource as any;
          if (found?.id) pid = found.id;
        } catch (_) {}
      }

      if (!pid) {
        setError(
          "No se encontró el registro de paciente asociado a tu cuenta. Contactá a tu profesional de salud."
        );
        setLoading(false);
        return;
      }

      setPatientId(pid);

      try {
        const patient = (await medplum.readResource("Patient", pid)) as any;
        const nombre = patient?.name?.[0]
          ? `${patient.name[0].given?.[0] ?? ""} ${patient.name[0].family ?? ""}`.trim()
          : "Paciente";
        setPatientName(nombre);
      } catch (_) {
        setPatientName("Paciente");
      }

      await loadDocumentos(pid);
      setLoading(false);
    };

    init();
  }, [router]);

  const loadDocumentos = async (pid: string) => {
    try {
      const result = await medplum.search("DocumentReference", {
        subject: `Patient/${pid}`,
      });

      const docs: DocItem[] = (result.entry ?? [])
        .map((e: any) => e.resource)
        .filter(
          (r: any) =>
            r?.content?.[0]?.attachment?.contentType === "application/pdf"
        )
        .map((r: any) => {
          const coding = r.type?.coding?.[0];
          return {
            id: r.id ?? "",
            title: r.content?.[0]?.attachment?.title ?? "Documento",
            typeCode: coding?.code ?? "34133-9",
            date: r.content?.[0]?.attachment?.creation
              ? new Date(r.content[0].attachment.creation).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "",
            binaryUrl: r.content?.[0]?.attachment?.url ?? "",
          };
        })
        .reverse();

      setDocumentos(docs);
    } catch (_) {
      setDocumentos([]);
    }
  };

  const handleViewPdf = async (doc: DocItem) => {
    setDownloading(doc.id);
    try {
      const blob = await medplum.download(doc.binaryUrl);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank");
    } catch (_) {
      alert("No se pudo abrir el documento. Intentá nuevamente.");
    } finally {
      setDownloading(null);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setUploadMsg("");
      setUploadError("");

      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0]?.errors?.[0];
        if (err?.code === "file-too-large") {
          setUploadError(`El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB.`);
        } else if (err?.code === "file-invalid-type") {
          setUploadError("Solo se aceptan archivos PDF.");
        } else {
          setUploadError("No se pudo procesar el archivo.");
        }
        return;
      }

      if (!patientId || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const sanitized = sanitizeFileName(file.name);
      const renamedFile = new File([file], sanitized, { type: file.type });
      const docType = DOCUMENT_TYPES.find((t) => t.code === selectedDocType)!;

      setUploadMsg("Subiendo...");
      try {
        const binary = await medplum.createBinary(renamedFile, sanitized, renamedFile.type);

        await medplum.createResource({
          resourceType: "DocumentReference",
          status: "current",
          type: {
            coding: [
              {
                system: LOINC_SYSTEM,
                code: docType.code,
                display: docType.display,
              },
            ],
            text: docType.display,
          },
          category: [
            {
              coding: [
                {
                  system: "http://loinc.org",
                  code: "11503-0",
                  display: "Medical records",
                },
              ],
            },
          ],
          subject: { reference: `Patient/${patientId}` },
          content: [
            {
              attachment: {
                contentType: renamedFile.type,
                url: `Binary/${binary.id}`,
                title: sanitized,
                creation: new Date().toISOString(),
              },
            },
          ],
          description: docType.display,
        });

        setUploadMsg(`Documento subido correctamente.`);
        setSelectedDocType("");
        await loadDocumentos(patientId);
      } catch (_) {
        setUploadError("Error al subir el archivo. Intentá nuevamente.");
        setUploadMsg("");
      }
    },
    [patientId, selectedDocType]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE_BYTES,
    accept: { "application/pdf": [".pdf"] },
    disabled: !patientId || !selectedDocType,
    multiple: false,
  });

  if (loading) {
    return (
      <MedplumAppShell>
        <div className="pacienteDashboard">
          <p>Cargando...</p>
        </div>
      </MedplumAppShell>
    );
  }

  return (
    <MedplumAppShell>
      <div className="pacienteDashboard">
        {error && <div className="errorBanner">{error}</div>}

        {!error && (
          <>
            <div className="pacienteWelcome">
              <h2>Bienvenido/a, {patientName}</h2>
              <p>Desde aquí podés enviar tus documentos médicos en formato PDF.</p>
            </div>

            <div className="pacienteUploadSection">
              <h3>Subir documento</h3>

              <div className="docTypeSelector">
                <label className="docTypeLabel">
                  1. Seleccioná el tipo de documento
                </label>
                <div className="docTypeGrid">
                  {DOCUMENT_TYPES.map((t) => (
                    <button
                      key={t.code}
                      className={`docTypeBtn${selectedDocType === t.code ? " selected" : ""}`}
                      onClick={() => {
                        setSelectedDocType(t.code);
                        setUploadMsg("");
                        setUploadError("");
                      }}
                    >
                      <span className="docTypeBtnIcon">{t.icon}</span>
                      <span className="docTypeBtnText">{t.display}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="docUploadStep">
                <label className="docTypeLabel">
                  2. Seleccioná o arrastrá el archivo PDF
                  {!selectedDocType && (
                    <span className="docTypeHint"> — primero elegí el tipo de documento</span>
                  )}
                </label>
                <div
                  className={`dropzone-container${!selectedDocType ? " dz-disabled" : ""}${isDragActive ? " dz-active" : ""}`}
                  {...getRootProps()}
                >
                  <input {...getInputProps()} />
                  <div className="dropzone-inner">
                    <div className="dropzone-content">
                      <Cloud className="dropzone-icon" />
                      <p className="dropzone-text">
                        <span className="dz-text-bold">Hacé clic para seleccionar</span>{" "}
                        o arrastrá un PDF aquí
                      </p>
                      <p className="dz-subtext">(Solo PDF · máximo {MAX_FILE_SIZE_MB} MB)</p>
                    </div>
                  </div>
                </div>

                {uploadMsg && <p className="uploadNote uploadOk">{uploadMsg}</p>}
                {uploadError && <p className="uploadNote uploadErr">{uploadError}</p>}
              </div>
            </div>

            <div className="pacienteDocumentos">
              <h3>Mis documentos enviados</h3>
              {documentos.length === 0 ? (
                <p className="emptyState">Todavía no enviaste ningún documento.</p>
              ) : (
                <ul>
                  {documentos.map((doc) => {
                    const tipo = getDocumentType(doc.typeCode);
                    return (
                      <li key={doc.id} className="docListItem">
                        <span className="docListIcon">{tipo.icon}</span>
                        <div className="docListInfo">
                          <span className="docListTitle">{doc.title}</span>
                          <span className="docListType">{tipo.display}</span>
                          {doc.date && <span className="docListDate">{doc.date}</span>}
                        </div>
                        <button
                          className="docViewBtn"
                          onClick={() => handleViewPdf(doc)}
                          disabled={downloading === doc.id}
                          title="Ver PDF"
                        >
                          {downloading === doc.id ? (
                            <span className="docViewBtnLoading">...</span>
                          ) : (
                            <Download size={16} />
                          )}
                          <span>{downloading === doc.id ? "Abriendo..." : "Ver"}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </MedplumAppShell>
  );
};

export default PacienteDashboard;
