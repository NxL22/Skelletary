import { Search, X } from "lucide-react";
import { mergeVoiceTranscript } from "../lib/voiceInput";
import VoiceFieldButton from "./VoiceFieldButton";

export default function SearchField({
  value,
  onChange,
  placeholder,
  voiceTitle,
  className = "",
  inputClassName = "",
  iconClassName = "",
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan ${iconClassName}`}
      />
      <input
        // Reutilizamos el mismo patron visual y funcional para cualquier
        // barra de busqueda o filtro y asi evitar desalineaciones entre vistas.
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        enterKeyHint="search"
        className={`field-shell w-full pr-24 text-base ${inputClassName}`}
        style={{ paddingLeft: "2.69em" }}
      />

      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
        <VoiceFieldButton
          onTranscript={(transcript) => onChange(mergeVoiceTranscript(value, transcript))}
          title={voiceTitle}
          idleLabel={voiceTitle}
          listeningLabel="Detener dictado"
          className="h-8.5 w-8.5"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-full border border-white/8 bg-white/[0.045] text-slate-400 backdrop-blur-sm transition duration-200 hover:border-cyan/30 hover:bg-cyan/10 hover:text-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
            aria-label="Limpiar busqueda"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
