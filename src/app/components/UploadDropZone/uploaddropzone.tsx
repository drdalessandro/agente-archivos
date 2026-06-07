import React, { useCallback, useState } from "react";
import { Cloud } from "lucide-react";
import { useDropzone } from "react-dropzone";
import "./uploaddropzone.css";
import { medplum } from "@/libs/medplumClient";
import { Patient } from "@/libs/types";
import { DOCUMENT_TYPES, LOINC_SYSTEM } from "@/libs/documentTypes";

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

interface UploadProps {
  selectedPatient: Patient | null;
  patientId?: string;
  onUploadSuccess: () => void;
}

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

const UploadDropZone = ({ selectedPatient, patientId, onUploadSuccess }: UploadProps) => {
  const effectivePatientId = patientId ?? selectedPatient?.id ?? null;
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadError, setUploadError] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      setUploadMsg("");
      setUploadError("");

      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0]?.errors?.[0];
        if (err?.code === "file-too-large") {
          setUploadError("El archivo supera el límite de 20 MB.");
        } else {
          setUploadError("Solo se aceptan archivos PDF.");
        }
        return;
      }

      if (!effectivePatientId || acceptedFiles.length === 0) return;

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
          subject: { reference: `Patient/${effectivePatientId}` },
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

        setUploadMsg("Documento subido correctamente.");
        setSelectedDocType("");
        onUploadSuccess();
      } catch (_) {
        setUploadError("Error al subir el archivo. Intentá nuevamente.");
        setUploadMsg("");
      }
    },
    [effectivePatientId, selectedDocType, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE_BYTES,
    accept: { "application/pdf": [".pdf"] },
    disabled: !effectivePatientId || !selectedDocType,
    multiple: false,
  });

  return (
    <div className="dz-wrapper">
      <div className="dz-typeSelector">
        <label className="dz-typeLabel">Tipo de documento</label>
        <select
          className="dz-typeSelect"
          value={selectedDocType}
          onChange={(e) => {
            setSelectedDocType(e.target.value);
            setUploadMsg("");
            setUploadError("");
          }}
          disabled={!effectivePatientId}
        >
          <option value="">— Seleccioná un tipo —</option>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t.code} value={t.code}>
              {t.icon} {t.display}
            </option>
          ))}
        </select>
      </div>

      <div
        className={`dropzone-container${!effectivePatientId || !selectedDocType ? " dz-disabled" : ""}${isDragActive ? " dz-active" : ""}`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <div className="dropzone-inner">
          <div className="dropzone-content">
            <Cloud className="dropzone-icon" />
            <p className="dropzone-text">
              <span className="dz-text-bold">Clic para subir</span> o arrastrá un PDF aquí
            </p>
            <p className="dz-subtext">(Solo PDF · máximo 20 MB)</p>
          </div>
        </div>
      </div>

      {uploadMsg && <p className="dz-msg dz-ok">{uploadMsg}</p>}
      {uploadError && <p className="dz-msg dz-err">{uploadError}</p>}
    </div>
  );
};

export default UploadDropZone;
