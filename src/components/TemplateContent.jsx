import { normalizeTemplateContentSpacing } from "../lib/reportFormatting";
import { ensureRequiredTemplateVariables } from "../lib/variables";

function isPlaceholder(part) {
  return /{{\s*[^}]+\s*}}/.test(part);
}

export default function TemplateContent({ text, compact = false }) {
  const normalizedText = normalizeTemplateContentSpacing(ensureRequiredTemplateVariables(text));
  const parts = normalizedText.split(/({{\s*[^}]+\s*}})/g);

  return (
    <pre
      className={`m-0 whitespace-pre-wrap break-words font-body text-sm leading-6 text-slate-200 ${
        compact ? "max-h-32 overflow-hidden text-[13px]" : ""
      }`}
    >
      {parts.map((part, index) =>
        isPlaceholder(part) ? (
          <span key={`${part}-${index}`} className="placeholder-chip mx-0.5 align-middle">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </pre>
  );
}
