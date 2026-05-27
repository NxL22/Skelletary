import { Mic, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createSpeechRecognition,
  isVoiceInputSupported,
  mapVoiceInputError,
} from "../lib/voiceInput";

const SILENCE_TIMEOUT_MS = 2800;

export default function VoiceFieldButton({
  onTranscript,
  disabled = false,
  className = "",
  language = "es-CL",
  title,
  idleLabel,
  listeningLabel,
}) {
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const errorMessageRef = useRef("");
  const sessionActiveRef = useRef(false);
  const silenceTimeoutRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState("");
  const isSupported = useMemo(() => isVoiceInputSupported(), []);

  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        window.clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!feedback || isListening) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback("");
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [feedback, isListening]);

  if (!isSupported) {
    return null;
  }

  function clearSilenceTimeout() {
    if (silenceTimeoutRef.current) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }

  function stopSessionBySilence() {
    sessionActiveRef.current = false;
    recognitionRef.current?.stop();
  }

  function scheduleSilenceTimeout() {
    clearSilenceTimeout();
    silenceTimeoutRef.current = window.setTimeout(() => {
      stopSessionBySilence();
    }, SILENCE_TIMEOUT_MS);
  }

  function handleRecognitionEnd() {
    clearSilenceTimeout();
    const transcript = finalTranscriptRef.current.trim();

    if (sessionActiveRef.current) {
      startListening();
      return;
    }

    setIsListening(false);
    recognitionRef.current = null;
    finalTranscriptRef.current = "";

    if (transcript) {
      onTranscript(transcript);
      setFeedback("");
      return;
    }

    if (!errorMessageRef.current) {
      setFeedback("No detectamos texto.");
      return;
    }

    setFeedback(errorMessageRef.current);
    errorMessageRef.current = "";
  }

  function startListening() {
    const recognition = createSpeechRecognition();

    if (!recognition) {
      return;
    }

    finalTranscriptRef.current = "";
    errorMessageRef.current = "";
    setFeedback("");

    // MDN marca SpeechRecognition como disponibilidad limitada, por eso
    // detectamos soporte en tiempo real y lo usamos solo como mejora progresiva.
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
      scheduleSilenceTimeout();
    };

    recognition.onresult = (event) => {
      let nextTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];

        if (result.isFinal) {
          nextTranscript += result[0]?.transcript || "";
        }
      }

      if (nextTranscript.trim()) {
        finalTranscriptRef.current = `${finalTranscriptRef.current} ${nextTranscript}`.trim();
      }

      scheduleSilenceTimeout();
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") {
        return;
      }

      if (event.error !== "no-speech") {
        errorMessageRef.current = mapVoiceInputError(event.error);
      }
    };

    recognition.onend = handleRecognitionEnd;
    recognitionRef.current = recognition;
    recognition.start();
  }

  function handleClick() {
    if (disabled) {
      return;
    }

    if (isListening) {
      sessionActiveRef.current = false;
      recognitionRef.current?.stop();
      return;
    }

    sessionActiveRef.current = true;
    startListening();
  }

  const resolvedTitle =
    feedback ||
    title ||
    (isListening
      ? listeningLabel || "Detener dictado"
      : idleLabel || "Dictar con el microfono");

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={resolvedTitle}
      aria-pressed={isListening}
      title={resolvedTitle}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
        isListening
          ? "border-cyan/40 bg-cyan/15 text-cyan shadow-[0_0_0_4px_rgba(34,211,238,0.08)]"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan/30 hover:bg-cyan/10 hover:text-cyan"
      } ${className}`}
    >
      {isListening ? (
        <Square className="h-3.5 w-3.5 animate-pulse fill-current" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}
