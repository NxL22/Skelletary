// Catalogo de mensajes que Skelly puede decir al iniciar sesion.
// Por ahora solo existe el saludo base. La idea es que el owner
// grabe mas MP3s y los registre aqui sin tocar el resto del codigo.

export const MENSAJES_SEMANALES = [
  {
    id: "semana_1",
    texto: "¡Hola!, es un placer ayudarte hoy.",
    audio: "audio de skelly/vocabulario/semana_1.mp3",
  },
  // Cuando grabes mas notas de voz, agrega nuevas entradas aqui.
  // Ejemplo para una segunda semana:
  // {
  //   id: "semana_2",
  //   texto: "¡Feliz lunes! Hoy te acompaño en tus informes.",
  //   audio: "audio de skelly/vocabulario/semana_2.mp3",
  // },
];

// Reservado para futuras categorias (motivacion, mensajes especiales, etc.).
// Mantener las arrays vacias es valido: el selector hara fallback al primer mensaje.
export const MENSAJES_MOTIVACION = [];
export const MENSAJES_ESPECIALES = [];