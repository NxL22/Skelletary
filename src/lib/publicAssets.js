export function getPublicAssetPath(relativePath) {
  // Vite expone `public/` desde la base de la app. Centralizamos esta regla para
  // que imagenes, videos y audios sigan funcionando tambien si se publica en subruta.
  const normalizedPath = relativePath.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${encodeURI(normalizedPath)}`;
}
