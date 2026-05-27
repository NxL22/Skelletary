function getSpeechRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeVoiceText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function normalizeSpacing(value = "") {
  return value
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function applyVoiceCommand(text, command, replacement) {
  const pattern = new RegExp(`\\b${escapeRegExp(command)}\\b`, "gi");
  return text.replace(pattern, replacement);
}

function formatMedicalDictationTranscript(transcript = "") {
  let formatted = ` ${normalizeVoiceText(transcript)} `;

  const commandReplacements = [
    ["punto y aparte", ".\n\n"],
    ["punto aparte", ".\n\n"],
    ["punto y seguido", ". "],
    ["nueva linea nueva linea", "\n\n"],
    ["nueva linea", "\n"],
    ["salto de linea", "\n"],
    ["nuevo parrafo nuevo parrafo", "\n\n"],
    ["nuevo parrafo", "\n\n"],
    ["aparte", "\n\n"],
    ["punto y coma", "; "],
    ["coma", ", "],
    ["dos puntos", ": "],
    ["punto", ". "],
    ["guion", " - "],
    ["slash", "/"],
    ["barra", "/"],
    ["abre parentesis", " ("],
    ["cierra parentesis", ") "],
  ];

  commandReplacements.forEach(([command, replacement]) => {
    formatted = applyVoiceCommand(formatted, command, replacement);
  });

  formatted = formatted
    .replace(/\s+([,.;:)/])/g, "$1")
    .replace(/([(/])\s+/g, "$1")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/([.!?])([A-Za-zÁÉÍÓÚÑ])/g, "$1 $2");

  return normalizeSpacing(formatted);
}

function appendVoiceText(currentText, nextText, options = {}) {
  if (!currentText.trim() || options.mode === "replace") {
    return nextText;
  }

  if (options.format === "medical-content") {
    const separator =
      currentText.endsWith("\n") || nextText.startsWith(".") || nextText.startsWith(",")
        ? ""
        : " ";

    return normalizeSpacing(`${currentText}${separator}${nextText}`);
  }

  const separator = options.multiline ? "\n" : " ";
  return `${currentText}${separator}${nextText}`;
}

export function isVoiceInputSupported() {
  return Boolean(getSpeechRecognitionConstructor());
}

export function createSpeechRecognition() {
  const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();

  if (!SpeechRecognitionConstructor) {
    return null;
  }

  return new SpeechRecognitionConstructor();
}

export function mapVoiceInputError(errorCode) {
  switch (errorCode) {
    case "audio-capture":
      return "No encontramos un microfono disponible.";
    case "not-allowed":
      return "Debes permitir el uso del microfono para dictar.";
    case "service-not-allowed":
      return "El navegador no permitio usar el servicio de voz.";
    case "network":
      return "No pudimos procesar el dictado por un problema de red.";
    case "no-speech":
      return "No detectamos voz en este intento.";
    default:
      return "No pudimos usar el dictado por voz en este momento.";
  }
}

export function mergeVoiceTranscript(currentValue, transcript, options = {}) {
  const currentText = `${currentValue ?? ""}`;
  const rawNextText = `${transcript ?? ""}`.trim();

  if (!rawNextText) {
    return currentText;
  }

  const nextText =
    options.format === "medical-content"
      ? formatMedicalDictationTranscript(rawNextText)
      : rawNextText;

  if (!nextText) {
    return currentText;
  }

  return appendVoiceText(currentText, nextText, options);
}

export function getVoiceUsageHint(format) {
  if (format === "medical-content") {
    return "Puedes decir: punto, coma, dos puntos, nueva linea, punto y aparte o aparte.";
  }

  return "Puedes dictar con el microfono si tu navegador lo permite.";
}
