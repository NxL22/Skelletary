import { FileSpreadsheet, Save, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildImportableTemplates,
  buildSuggestedMapping,
  IMPORT_FIELD_OPTIONS,
  parseSpreadsheetFile,
  validateImportedRows,
} from "../lib/importTemplates";
import ModalShell from "./ModalShell";

function MappingSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="field-shell">
      <option value="">Ignorar</option>
      {IMPORT_FIELD_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default function ImportTemplatesModal({
  open,
  onClose,
  existingTemplates,
  onImport,
}) {
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const validatedRows = useMemo(
    () => validateImportedRows(rows, mapping, existingTemplates),
    [rows, mapping, existingTemplates],
  );
  const validRows = validatedRows.filter((row) => row.isValid);
  const invalidRows = validatedRows.filter((row) => !row.isValid);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const parsed = await parseSpreadsheetFile(file);
      setFileName(file.name);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(buildSuggestedMapping(parsed.headers));
      setError("");
    } catch (parseError) {
      setError(parseError.message || "No pudimos leer el archivo.");
      setHeaders([]);
      setRows([]);
      setMapping({});
      setFileName("");
    }

    event.target.value = "";
  }

  async function handleImport() {
    if (!validRows.length) {
      setError("No hay filas validas para importar.");
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      await onImport({
        fileName,
        importKind: fileName.toLowerCase().endsWith(".csv") ? "csv" : "xlsx",
        rows: buildImportableTemplates(validatedRows),
      });
      onClose();
    } catch (importError) {
      setError(importError.message || "No pudimos completar la importacion.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <ModalShell
      open={open}
      wide
      title="Importar plantillas"
      subtitle="Carga un archivo CSV o Excel y mapea sus columnas sin tocar JSON."
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">
            {validRows.length} filas validas · {invalidRows.length} con observaciones
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="button-secondary">
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="button-primary"
              disabled={!validRows.length || isImporting}
            >
              <Save className="h-4 w-4" />
              {isImporting ? "Importando..." : "Guardar en mi biblioteca"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <label className="button-secondary cursor-pointer">
            <UploadCloud className="h-4 w-4" />
            Seleccionar CSV o Excel
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <p className="mt-3 text-sm text-slate-400">
            Soportado en esta fase: CSV y Excel. Word y PDF quedan para mas adelante.
          </p>
          {fileName ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1 text-sm text-cyan">
              <FileSpreadsheet className="h-4 w-4" />
              {fileName}
            </div>
          ) : null}
        </div>

        {headers.length ? (
          <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-4">
            <h3 className="font-display text-lg font-semibold text-white">Mapeo de columnas</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ajusta el destino de cada columna. Titulo, categoria y contenido son obligatorios.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {headers.map((header) => (
                <label key={header} className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">{header}</span>
                  <MappingSelect
                    value={mapping[header] || ""}
                    onChange={(value) =>
                      setMapping((current) => ({
                        ...current,
                        [header]: value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {validatedRows.length ? (
          <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-4">
            <h3 className="font-display text-lg font-semibold text-white">Vista previa</h3>
            <div className="mt-4 max-h-[360px] overflow-auto rounded-2xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-3 py-2">Fila</th>
                    <th className="px-3 py-2">Titulo</th>
                    <th className="px-3 py-2">Categoria</th>
                    <th className="px-3 py-2">Shortcut</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {validatedRows.map((row) => (
                    <tr key={row.rowNumber} className="border-t border-white/10">
                      <td className="px-3 py-2 text-slate-400">{row.rowNumber}</td>
                      <td className="px-3 py-2 text-white">{row.mapped.title || "—"}</td>
                      <td className="px-3 py-2 text-slate-300">{row.mapped.category || "—"}</td>
                      <td className="px-3 py-2 font-mono text-cyan">
                        {row.mapped.shortcut || "—"}
                      </td>
                      <td
                        className={`px-3 py-2 ${
                          row.isValid ? "text-emerald-300" : "text-rose"
                        }`}
                      >
                        {row.isValid ? "Lista para importar" : row.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-rose">{error}</p> : null}
      </div>
    </ModalShell>
  );
}
