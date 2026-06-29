// Selector de mensajes para Skelly.
// Decide que mensaje reproducir segun la ocasion.
// Por ahora solo expone la rotacion semanal automatica.

import { MENSAJES_SEMANALES } from "../data/skellyMensajes";

/**
 * Devuelve el mensaje que Skelly debe decir esta semana.
 * Calcula la semana del ano (1-53) a partir de la fecha recibida
 * y elige el mensaje correspondiente del catalogo.
 *
 * Si el catalogo tiene un solo mensaje, siempre devuelve ese.
 * Si tiene varios, rota con wrap-around (semana N -> mensaje N % total).
 * Si por algun motivo la fecha falla, cae al primer mensaje disponible.
 *
 * @param {Date} [fecha] - Fecha base para el calculo. Por defecto usa la actual.
 * @returns {{id:string, texto:string, audio:string}}
 */
export function obtenerMensajeSemanal(fecha = new Date()) {
  // Si el catalogo esta vacio, devolvemos null para que la UI haga su propio fallback.
  if (!Array.isArray(MENSAJES_SEMANALES) || MENSAJES_SEMANALES.length === 0) {
    return null;
  }

  // Proteccion minima por si `fecha` no es una Date valida.
  const fechaValida = fecha instanceof Date && !Number.isNaN(fecha.getTime()) ? fecha : new Date();

  // Calculamos la semana del ano como "cantidad de semanas completas desde el 1 de enero".
  const inicioDeAnio = new Date(fechaValida.getFullYear(), 0, 1);
  const diferenciaMs = fechaValida.getTime() - inicioDeAnio.getTime();
  const semanaDelAnio = Math.floor(diferenciaMs / (7 * 24 * 60 * 60 * 1000)) + 1;

  // Wrap-around: si hay 3 mensajes y estamos en la semana 5, va al mensaje (5 - 1) % 3 = 1.
  const indice = (semanaDelAnio - 1) % MENSAJES_SEMANALES.length;

  // Doble red de seguridad: si el indice cae fuera de rango, al primero.
  return MENSAJES_SEMANALES[indice] ?? MENSAJES_SEMANALES[0];
}

/**
 * Devuelve el primer mensaje disponible del catalogo.
 * Se usa como fallback final cuando nada mas funciona
 * (audio falla, fecha invalida, catalogo vacio).
 */
export function obtenerMensajeFallback() {
  if (!Array.isArray(MENSAJES_SEMANALES) || MENSAJES_SEMANALES.length === 0) {
    return null;
  }
  return MENSAJES_SEMANALES[0];
}