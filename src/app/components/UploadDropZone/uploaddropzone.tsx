import React, { useCallback } from "react";
import { Cloud } from "lucide-react";
import { useDropzone } from "react-dropzone";
import "./uploaddropzone.css";
import { medplum } from "@/libs/medplumClient";
import { Patient } from "@/libs/types";

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

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!effectivePatientId) {
        console.error("No hay paciente seleccionado");
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const sanitized = sanitizeFileName(file.name);
        const renamedFile = new File([file], sanitized, { type: file.type });

        try {
          const binary = await medplum.createBinary(renamedFile, sanitized, renamedFile.type);

          await medplum.createResource({
            resourceType: "DocumentReference",
            status: "current",
            type: {
              coding: [
                {
                  system: "Agente-Archivos",
                  code: "pdf",
                  display: "Outpatient Note",
                },
              ],
              text: "PDF Document",
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
            description: "Patient PDF Document",
          });

          onUploadSuccess();
        } catch (error) {
          console.error("Error al subir el archivo:", error);
        }
      }
    },
    [effectivePatientId, onUploadSuccess]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: 4 * 1024 * 1024,
    accept: { "application/pdf": [".pdf"] },
    disabled: !effectivePatientId,
  });

  return (
    <div className="dropzone-container" {...getRootProps()}>
      <input {...getInputProps()} />
      <div className="dropzone-inner">
        <div className="dropzone-content">
          <Cloud className="dropzone-icon" />
          <p className="dropzone-text">
            <span className="dz-text-bold">Clic para subir</span> o arrastrá un PDF aquí
          </p>
          <p className="dz-subtext">(Solo PDF, máximo 4MB)</p>
        </div>
      </div>
    </div>
  );
};

export default UploadDropZone;
