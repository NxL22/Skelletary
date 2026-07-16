// AssistantPanel
// =========================
// Panel del modulo Asistente de informes (Skelly redactor).
// Vive como pieza horizontal full width debajo del card de Skelly mascota en el Header.
//
// Flujo:
//   1. La usuaria escribe una sola linea en lenguaje natural en el input de la izquierda.
//   2. Al apretar Enter (sin Shift) o el boton send flotante, se llama al Edge Function.
//   3. La respuesta se sanitiza y se muestra en el output de la derecha (modo lectura).
//   4. Debajo del output hay dos botones de feedback:
//      - "Sirvio tal cual, guardar": feedback positivo (sin edicion).
//      - "Lo retoque y guardo version final": abre modo edicion in-place.
//   5. En modo edicion el output se vuelve un textarea editable. Al guardar se
//      persiste el par (input -> informe final) para que Skelly aprenda.
//
// Sprint 2: layout horizontal, sin dropdown de plantilla, send flotante,
//           botones feedback (UI), modo edicion. Persistencia llega en Sprint 3.
//
// Lo que NO hace:
//   - No toca a Skelly mascota (esa sigue intacta arriba).
//   - No inventa reglas de la libreria de plantillas oficial.
//   - No persiste el historial todavia (vive en memoria; Sprint 3 lo conecta al bucket).

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Loader2, PencilLine, Send, Sparkles, ThumbsUp, X } from "lucide-react";
import { invokeAssistantStream, AssistantError } from "../lib/assistant";
import { copyText, playCopyFeedback } from "../lib/clipboard";
import { isVoiceInputSupported } from "../lib/voiceInput";
import SkellyThinking from "./SkellyThinking";
import VoiceFieldButton from "./VoiceFieldButton";

const MAX_INPUT_LENGTH = 2000;
const PROMPT_HINT = 'Ej: "eco abdomen normal agrega: esteatosis"';

function classifyError(error) {
  if (!error) {
    return null;
  }
  if (error instanceof AssistantError) {
    return {
      code: error.code,
      message: error.message,
      detail: error.detail,
      extra: error.extra,
    };
  }
  return {
    code: "UNKNOWN",
    message: error?.message ?? "Algo salio mal.",
    detail: null,
    extra: null,
  };
}

export default function AssistantPanel({
  profile = null,
  onPushToast = null,
  hasAccess = false,
  onFeedbackRecorded = null,
}) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState(null);
  // true cuando el output es un mensaje del sistema (fallback) en lugar de
  // un informe real. Sirve para ocultar Copy + feedback y dar estilo visual
  // distinto (lavanda en vez de slate) para que la usuaria no confunda
  // un error con un informe.
  const [isFallback, setIsFallback] = useState(false);

  // Flujo de pregunta breve: cuando el LLM aplica paso 3 del algoritmo y
  // devuelve PREGUNTA: ..., la mostramos aca. La usuaria escribe su
  // respuesta en el mismo input principal (limpiamos `input` cuando llega
  // la pregunta para que tenga espacio limpio) y al apretar Enter se
  // reenvia como input nuevo.
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [originalInput, setOriginalInput] = useState("");
  const [lastRequestInput, setLastRequestInput] = useState("");

  // Modo edicion del output (se activa al apretar "Lo retoque").
  const [isEditingOutput, setIsEditingOutput] = useState(false);
  const [editedOutput, setEditedOutput] = useState("");

  // Feedback pendiente de confirmacion (se setea cuando el usuario apreta un boton).
  // El padre (App.jsx o el Sprint 3) lo recibe via onFeedbackRecorded.
  const [lastSubmittedFeedback, setLastSubmittedFeedback] = useState(null);

  const inputRef = useRef(null);
  const outputRef = useRef(null);

  // Reseteo el toast del "copiado" despues de un rato.
  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  // Timeout duro por si el LLM se cuelga: soltamos el estado "cargando" para
  // permitir reintento. El backend tiene su propio timeout.
  useEffect(() => {
    if (!submitting) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setSubmitting(false), 65_000);
    return () => window.clearTimeout(timeoutId);
  }, [submitting]);

  function handleSubmit(event) {
    event?.preventDefault?.();
    if (submitting) {
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) {
      setError({
        code: "BAD_INPUT",
        message: "Escribe un mensaje para Skelletary antes de enviar.",
      });
      inputRef.current?.focus();
      return;
    }

    // Si hay una pregunta pendiente del turno anterior, lo que la usuaria
    // escribio en el textarea principal ES la respuesta a esa pregunta.
    // Guardamos el input original para concatenar en el futuro si hace falta.
    const textToSend = trimmed;
    const baseOriginal = pendingQuestion && originalInput
      ? originalInput
      : trimmed;

    setSubmitting(true);
    setError(null);
    setIsEditingOutput(false);
    setOutput("");
    setPendingQuestion(null);
    setOriginalInput(baseOriginal);
    setLastRequestInput(
      pendingQuestion && originalInput
        ? `${originalInput}\nRespuesta a la aclaracion: ${trimmed}`
        : trimmed,
    );
    setIsFallback(false);

    // Mientras el LLM esta pensando NO mostramos el texto crudo del stream.
    // Solo mostraremos el output cuando llegue el evento `done` con el texto
    // saneado y validado por el sanitizer del backend.
    invokeAssistantStream({
      input: textToSend,
      onStart: (initialUsage) => {
        if (initialUsage) {
          setUsage(initialUsage);
        }
      },
      onDelta: () => {},
      onPreview: (safePreview) => setOutput(safePreview),
    })
      .then((result) => {
        // Si el LLM devolvio una pregunta breve, mostramos la pregunta
        // y dejamos a la usuaria responder. Si devolvio el informe, lo
        // mostramos como siempre.
        if (result.question) {
          setOutput("");
          setPendingQuestion(result.question);
          setOriginalInput(baseOriginal);
          setInput("");
          setSubmitting(false);
          requestAnimationFrame(() => {
            outputRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          });
          return;
        }
        const finalText = result.text || "";
        setOutput(finalText);
        setWarnings(result.warnings ?? []);
        setUsage(result.usage ?? null);
        setIsFallback(Boolean(result.isFallback));
        setPendingQuestion(null);
        setOriginalInput("");
        setSubmitting(false);
        requestAnimationFrame(() => {
          outputRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        });
      })
      .catch((caught) => {
        setSubmitting(false);
        const classified = classifyError(caught);
        setError(classified);
        if (onPushToast && classified?.code === "RATE_LIMITED") {
          onPushToast(classified.message, "warning");
        }
      });
  }

  function handleKeyDown(event) {
    // Enter sin Shift envia. Shift+Enter inserta salto de linea.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  async function handleCopy() {
    if (!output) {
      return;
    }
    try {
      await copyText(output);
      playCopyFeedback();
      setCopied(true);
      if (onPushToast) {
        onPushToast("Informe copiado al portapapeles", "success");
      }
    } catch {
      if (onPushToast) {
        onPushToast("No pudimos copiar al portapapeles", "error");
      }
    }
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setWarnings([]);
    setError(null);
    setIsEditingOutput(false);
    setEditedOutput("");
    setLastSubmittedFeedback(null);
    setPendingQuestion(null);
    setOriginalInput("");
    setLastRequestInput("");
    setIsFallback(false);
    inputRef.current?.focus();
  }

  // ===== FEEDBACK (Sprint 2: UI y emision. Sprint 3: persistencia real). =====

  function handleFeedbackPositive() {
    // El output quedo tal cual Skelly lo entrego. Es un feedback positivo.
    const payload = {
      type: "positive",
      originalInput: lastRequestInput,
      skellyOutput: output,
      humanOutput: output,
    };
    setLastSubmittedFeedback(payload);
    onFeedbackRecorded?.(payload);
    if (onPushToast) {
      onPushToast("Guardamos tu feedback. Skelly aprende.", "success");
    }
  }

  function handleStartEdit() {
    setEditedOutput(output);
    setIsEditingOutput(true);
  }

  function handleCancelEdit() {
    setIsEditingOutput(false);
    setEditedOutput("");
  }

  function handleSaveEdit() {
    const cleaned = editedOutput.trim();
    if (!cleaned) {
      if (onPushToast) {
        onPushToast("El informe no puede quedar vacio.", "warning");
      }
      return;
    }
    const payload = {
      type: "edited",
      originalInput: lastRequestInput,
      skellyOutput: output,
      humanOutput: cleaned,
    };
    setOutput(cleaned);
    setIsEditingOutput(false);
    setLastSubmittedFeedback(payload);
    onFeedbackRecorded?.(payload);
    if (onPushToast) {
      onPushToast("Guardamos tu version. Skelly aprende.", "success");
    }
  }

  if (!hasAccess) {
    return null;
  }

  const remainingLabel = usage?.remaining;
  const isRateLimited = error?.code === "RATE_LIMITED";
  const canSubmit = !submitting && input.trim().length > 0 && !isRateLimited;
  const voiceSupported = useMemo(() => isVoiceInputSupported(), []);

  function handleVoiceTranscript(text) {
    const trimmed = (text ?? "").trim();
    if (!trimmed) return;
    setInput((prev) => {
      const combined = prev ? `${prev} ${trimmed}` : trimmed;
      return combined.slice(0, MAX_INPUT_LENGTH);
    });
  }

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-cyan/15 bg-[linear-gradient(180deg,rgba(32,55,72,0.78),rgba(10,15,24,0.86))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_32px_rgba(6,12,28,0.18)] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(183,148,244,0.10),transparent_38%)]" />

      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="icon-chip">
            <Sparkles className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-[14px] uppercase tracking-[0.24em] text-slate-400">
              Skelly te asiste
            </p>
            <p className="font-display text-base font-semibold text-white">
              Tu asistente para informes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {typeof remainingLabel === "number" ? (
            <span className="badge-soft">
              {remainingLabel}/{usage?.limit ?? 300} envios libres
            </span>
          ) : null}
          {/* Boton Limpiar: SIEMPRE reservado (~36px) para que aparezca/
              desaparezca sin alterar la altura del header. */}
          <button
            type="button"
            onClick={handleClear}
            aria-hidden={!output && !input}
            tabIndex={output || input ? 0 : -1}
            className="button-secondary"
            disabled={submitting}
            style={{ visibility: output || input ? "visible" : "hidden" }}
          >
            <X className="h-4 w-4" />
            Limpiar
          </button>
        </div>
      </header>

      <form className="relative mt-4" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Input: vertical angosto, el textarea ocupa el ancho del card. */}
          <div>
            <label
              htmlFor="assistant-input"
              className="mb-2 block text-[14px] uppercase tracking-[0.2em] text-slate-500"
            >
              Mensaje para Skelly
            </label>
            <div className="relative">
              <textarea
                id="assistant-input"
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_LENGTH))}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder={pendingQuestion ? "Escribe tu respuesta aca. Enter para regenerar." : PROMPT_HINT}
                disabled={submitting}
                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 pb-16 text-sm leading-6 text-slate-100 placeholder:text-slate-500 focus:border-cyan/40 focus:outline-none focus:ring-2 focus:ring-cyan/40"
              />
              <div className="pointer-events-none absolute bottom-4 left-3 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                {input.length}/{MAX_INPUT_LENGTH}
              </div>

              {/* Botonera inferior del textarea: voz (si hay soporte) a la
                  izquierda y send a la derecha. Subimos los botones para que
                  respiren del texto del usuario y no compitan visualmente. */}
              <div className="absolute bottom-4 right-3 flex items-center gap-2">
                {voiceSupported ? (
                  <VoiceFieldButton
                    onTranscript={handleVoiceTranscript}
                    disabled={submitting}
                    language="es-CL"
                    idleLabel="Dictar con el microfono"
                    listeningLabel="Detener dictado"
                    className="h-9 w-9 border-white/10 bg-white/5 text-slate-300 hover:border-cyan/30 hover:bg-cyan/10 hover:text-cyan"
                  />
                ) : null}
                <button
                  type="submit"
                  aria-label="Enviar mensaje a Skelly"
                  disabled={!canSubmit}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan text-slate-950 shadow-lg shadow-cyan/25 transition duration-200 ${
                    canSubmit ? "hover:bg-cyan/90" : ""
                  } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-cyan`}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2 text-[14px] text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-cyan" />
              {pendingQuestion
                ? "Enter para regenerar con tu respuesta. Shift+Enter para nueva linea."
                : "Enter para enviar. Shift+Enter para nueva linea."}
            </div>
          </div>

          {/* Output: abajo del input (vertical, no horizontal).
              Cada bloque condicional reserva SIEMPRE su espacio con
              min-height. Cuando el contenido no aplica, el contenedor
              queda con visibility:hidden para no mostrar nada pero
              MANTIENE el alto reservado. Asi NUNCA hay layout shift:
              ni el boton Copy, ni los botones de feedback, ni el bloque
              de pregunta, ni los warnings, ni el error alteran la altura
              de la seccion cuando aparecen o desaparecen. */}
          <div ref={outputRef}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="block text-[14px] uppercase tracking-[0.2em] text-slate-500">
                Resultado
              </label>
              {/* Boton Copy: siempre presente, invisible cuando no aplica.
                  Reserva ~36px para que no haya salto al aparecer.
                  Tambien se oculta cuando es un fallback del sistema
                  (no tiene sentido copiar un mensaje de error). */}
              <button
                type="button"
                onClick={handleCopy}
                aria-hidden={!output || isEditingOutput || isFallback}
                tabIndex={
                  output && !isEditingOutput && !isFallback ? 0 : -1
                }
                className="button-secondary !rounded-full !px-3 !py-1.5"
                title="Copiar al portapapeles"
                style={{
                  visibility:
                    output && !isEditingOutput && !isFallback
                      ? "visible"
                      : "hidden",
                }}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-300" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>

            {/* Bloque de pregunta pendiente: SIEMPRE reservado.
                Cuando hay pregunta: contenido visible. Cuando no:
                contenedor invisible pero con la misma altura (~140px). */}
            {pendingQuestion ? (
              <div className="mb-4 space-y-3">
                <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
                  <p className="font-medium">Skelly necesita un dato antes de redactar:</p>
                  <p className="mt-1">{pendingQuestion}</p>
                </div>
                {originalInput ? (
                  <p className="text-[14px] leading-6 text-slate-500">
                    Contexto original: <span className="text-slate-300">{originalInput}</span>
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Output / Edit mode: ambos modos comparten la misma min-height
                para que al alternar entre ver y editar el bloque no cambie
                de tamano. */}
            <div className="min-h-[240px]">
              {output && isEditingOutput ? (
                <div className="space-y-3">
                  <p className="text-[15px] leading-6 text-slate-400">
                    Edita el informe. Skelly va a aprender de tu version para futuros informes.
                  </p>
                  <textarea
                    value={editedOutput}
                    onChange={(event) => setEditedOutput(event.target.value)}
                    rows={10}
                    className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-3 font-mono text-[16px] leading-7 text-slate-100 focus:border-cyan/40 focus:outline-none focus:ring-2 focus:ring-cyan/40"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="button-primary"
                    >
                      <Check className="h-4 w-4" />
                      Guardar version final
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="button-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : submitting && !output ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-6">
                  <SkellyThinking text="Skelly esta pensando el informe" />
                </div>
) : (
                <pre
                  className={`max-h-72 min-h-[240px] overflow-auto whitespace-pre-wrap rounded-2xl border px-3 py-3 text-[16px] leading-7 ${
                    isFallback
                      ? "border-lavender/30 bg-lavender/[0.08] text-lavender"
                      : "border-white/10 bg-slate-950/80 font-mono text-slate-100"
                  }`}
                >
                  {output ? (
                    output
                  ) : (
                    <span className="text-slate-500">
                      El informe aparecera aqui, listo para copiar y pegar.
                    </span>
                  )}
                </pre>
              )}
            </div>

            {/* Botones de feedback: SIEMPRE reservados (~44px). Cuando no
                aplica (no hay output, estamos editando, o es un fallback
                del sistema), el contenedor queda invisible pero mantiene
                el alto. */}
            <div
              className="mt-3 min-h-[44px]"
              aria-hidden={!output || isEditingOutput || isFallback}
              style={{
                visibility:
                  output && !isEditingOutput && !isFallback
                    ? "visible"
                    : "hidden",
              }}
            >
              {output && !isEditingOutput && !isFallback ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleFeedbackPositive}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-3 py-1.5 text-sm font-medium text-cyan transition hover:bg-cyan/15"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Sirvio tal cual, guardar
                  </button>
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex items-center gap-2 rounded-full border border-lavender/20 bg-lavender/10 px-3 py-1.5 text-sm font-medium text-lavender transition hover:bg-lavender/15"
                  >
                    <PencilLine className="h-4 w-4" />
                    Lo retoque y guardo version final
                  </button>
                </div>
              ) : null}
            </div>

{/* Warnings: SIEMPRE reservados (~44px). Se ocultan cuando es un
                fallback del sistema porque el mensaje ya viene incorporado
                en el output y mostrarlos duplica el texto. */}
            <div
              className="mt-3 min-h-[44px]"
              aria-hidden={warnings.length === 0 || Boolean(error) || isFallback}
              style={{
                visibility:
                  warnings.length > 0 && !error && !isFallback
                    ? "visible"
                    : "hidden",
              }}
            >
              {warnings.length > 0 && !error && !isFallback ? (
                <div className="relative rounded-2xl border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-[15px] leading-6 text-amber-300">
                  {warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </form>

      {/* El error se muestra solo cuando existe para evitar un bloque vacio
          demasiado grande al final del panel. */}
      {error ? (
        <div
          role="alert"
          className="mt-4"
        >
          <div
            className={`rounded-2xl border px-3 py-2 text-sm leading-6 ${
              error.code === "RATE_LIMITED"
                ? "border-amber-300/30 bg-amber-300/10 text-amber-300"
                : "border-rose/30 bg-rose/10 text-rose"
            }`}
          >
            <p className="font-medium">{error.message}</p>
            {error.detail ? (
              <p className="mt-1 text-[15px] leading-6 opacity-80">{error.detail}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
