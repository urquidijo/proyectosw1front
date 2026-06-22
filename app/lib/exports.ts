const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL no está configurado");
}

export type ExportFormat = "sql" | "csv" | "json" | "xlsx";

export const EXPORT_FORMATS: { value: ExportFormat; label: string; hint: string }[] = [
  { value: "sql", label: "SQL", hint: "Script de INSERTs, igual al de siempre" },
  { value: "csv", label: "CSV", hint: "Una tabla, o un .zip con un .csv por tabla" },
  { value: "json", label: "JSON", hint: "Arreglo de filas, ideal para scripts/APIs" },
  { value: "xlsx", label: "Excel (.xlsx)", hint: "Un libro con una hoja por tabla" },
];

type DownloadedFile = {
  blob: Blob;
  filename: string;
};

function extractFilename(response: Response, fallback: string): string {
  const header = response.headers.get("Content-Disposition");
  const match = header?.match(/filename="([^"]+)"/);
  return match?.[1] ?? fallback;
}

export async function downloadGenerationExportRequest(
  token: string,
  projectId: string,
  generationId: string,
  format: ExportFormat,
  table?: string,
): Promise<DownloadedFile> {
  const query = new URLSearchParams({ format });
  if (table) {
    query.set("table", table);
  }

  const response = await fetch(
    `${API_URL}/projects/${projectId}/generations/${generationId}/export?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = data?.message || "No se pudo exportar la generación";
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  const blob = await response.blob();
  const filename = extractFilename(response, `syndata-${generationId}.${format}`);

  return { blob, filename };
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
