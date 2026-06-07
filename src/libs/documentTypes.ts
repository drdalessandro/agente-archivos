export const LOINC_SYSTEM = "http://loinc.org";

export interface DocumentType {
  code: string;
  display: string;
  icon: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  { code: "11502-2", display: "Resultados de laboratorio", icon: "🧪" },
  { code: "18748-4", display: "Imágenes médicas (Rx / TAC / RMN / Eco)", icon: "🩻" },
  { code: "51969-4", display: "Análisis genético", icon: "🧬" },
  { code: "11526-1", display: "Informe de patología", icon: "🔬" },
  { code: "34117-2", display: "Resumen de consulta médica", icon: "📋" },
  { code: "34133-9", display: "Otros documentos médicos", icon: "📄" },
];

export function getDocumentType(code: string): DocumentType {
  return (
    DOCUMENT_TYPES.find((t) => t.code === code) ?? {
      code,
      display: "Documento médico",
      icon: "📄",
    }
  );
}
