// src/lib/assistantSanitize.js
// =====================================================================
// Defensa adicional en cliente. El backend ya sanea la respuesta, pero
// aplicamos una pasada ligera para cubrir el caso (raro) en que el
// Edge Function falle y el cliente termine mostrando un string crudo.

// Reemplaza fences ``` por cadena vacia.
function stripCodeFences(text) {
  return text.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "");
}

// Quita titulos markdown al inicio de linea.
function stripHeadings(text) {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s{0,3}#{1,6}\s+/, ""))
    .join("\n");
}

// Quita ** y __ que se usan como negrita en MD.
function stripBoldMarkers(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2");
}

export function clientSanitize(text) {
  if (!text || typeof text !== "string") {
    return "";
  }
  return [
    stripCodeFences,
    stripHeadings,
    stripBoldMarkers,
    (value) =>
      value
        .split("\n")
        .map((line) => line.replace(/[ \t]+$/g, "").replace(/^[ \t]+/, ""))
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
  ].reduce((acc, fn) => fn(acc), text);
}