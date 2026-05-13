"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Cloud } from "lucide-react";
import Header from "../../components/Header/header";
import { medplum } from "@/libs/medplumClient";
import { parseClientCookies } from "@/libs/cookies";
import "./paciente.css";
import "../../components/UploadDropZone/uploaddropzone.css";

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
  title: string;
}

const PacienteDashboard = () => {
  const router = useRouter();
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [documentos, setDocumentos] = useState<DocItem[]>([]);
  const [uploadMsg, setUploadMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const cookies = parseClientCookies();
      const token = cookies.medplumAccessToken;

      if (!token || cookies.medplumUserRole !== "patient") {
        router.push("/login/paciente");
        return;
      }

      medplum.setAccessToken(token);

      let pid = cookies.medplumPatientId || null;
      const email = cookies.medplumUserEmail || "";

      if (!pid && email) {
        try {
          const result = await medplum.search("Patient", {
            telecom: `email|${email}`,
          });
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
        const patient = await medplum.readResource("Patient", pid) as any;
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
        .filter((r: any) => r?.type?.coding?.some((c: any) => c.code === "pdf"))
        .map((r: any) => ({
          title: r.content?.[0]?.attachment?.title ?? "Documento",
        }));
      setDocumentos(docs);
    } catch (_) {
      setDocumentos([]);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!patientId || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const sanitized = sanitizeFileName(file.name);
      const renamedFile = new File([file], sanitized, { type: file.type });

      setUploadMsg("Subiendo...");
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
                display: "Documento PDF",
              },
            ],
            text: "PDF Document",
          },
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
          description: "Documento subido por el paciente",
        });

        setUploadMsg(`"${sanitized}" subido correctamente.`);
        await loadDocumentos(patientId);
      } catch (_) {
        setUploadMsg("Error al subir el archivo. Intentá nuevamente.");
      }
    },
    [patientId]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: 4 * 1024 * 1024,
    accept: { "application/pdf": [".pdf"] },
    disabled: !patientId,
  });

  if (loading) {
    return (
      <>
        <Header />
        <div className="pacienteDashboard">
          <p>Cargando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pacienteDashboard">
        {error && <div className="errorBanner">{error}</div>}

        {!error && (
          <>
            <div className="pacienteWelcome">
              <h2>Bienvenida, {patientName}</h2>
              <p>Desde aquí podés enviar tus documentos en formato PDF.</p>
            </div>

            <div className="pacienteUploadSection">
              <h3>Subir documento</h3>
              <div className="dropzone-container" {...getRootProps()}>
                <input {...getInputProps()} />
                <div className="dropzone-inner">
                  <div className="dropzone-content">
                    <Cloud className="dropzone-icon" />
                    <p className="dropzone-text">
                      <span className="dz-text-bold">Hacé clic para seleccionar</span> o arrastrá un PDF aquí
                    </p>
                    <p className="dz-subtext">(Solo PDF, máximo 4MB)</p>
                  </div>
                </div>
              </div>
              {uploadMsg && <p className="uploadNote">{uploadMsg}</p>}
            </div>

            <div className="pacienteDocumentos">
              <h3>Mis documentos enviados</h3>
              {documentos.length === 0 ? (
                <p className="emptyState">Todavía no enviaste ningún documento.</p>
              ) : (
                <ul>
                  {documentos.map((doc, i) => (
                    <li key={i}>
                      <span className="docIcon">📄</span>
                      {doc.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default PacienteDashboard;
