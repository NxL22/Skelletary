// generate-favicon.mjs
// ============================================================
// Script auxiliar (no parte del build). Convierte el SVG vectorial
// de Skelly en todos los PNGs y el favicon.ico que necesita la app.
// Se ejecuta una sola vez (o cada vez que se cambia el SVG).
//
// Uso: node scripts/generate-favicon.mjs

import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// sharp convierte SVG -> PNG en cualquier tamano sin perder calidad.
// to-ico empaqueta varios PNGs en un unico favicon.ico multi-resolucion.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const svgPath = path.join(projectRoot, "public", "favicon", "skelly-favicon.svg");
const outDir = path.join(projectRoot, "public", "favicon", "skelly");

const sizes = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-96x96.png", size: 96 },
  { name: "apple-icon-57x57.png", size: 57 },
  { name: "apple-icon-60x60.png", size: 60 },
  { name: "apple-icon-72x72.png", size: 72 },
  { name: "apple-icon-76x76.png", size: 76 },
  { name: "apple-icon-114x114.png", size: 114 },
  { name: "apple-icon-120x120.png", size: 120 },
  { name: "apple-icon-144x144.png", size: 144 },
  { name: "apple-icon-152x152.png", size: 152 },
  { name: "apple-icon-167x167.png", size: 167 },
  { name: "apple-icon-180x180.png", size: 180 },
  { name: "apple-icon-1024x1024.png", size: 1024 },
  { name: "ms-icon-70x70.png", size: 70 },
  { name: "ms-icon-144x144.png", size: 144 },
  { name: "ms-icon-150x150.png", size: 150 },
  { name: "ms-icon-310x310.png", size: 310 },
  { name: "android-icon-36x36.png", size: 36 },
  { name: "android-icon-48x48.png", size: 48 },
  { name: "android-icon-72x72.png", size: 72 },
  { name: "android-icon-96x96.png", size: 96 },
  { name: "android-icon-144x144.png", size: 144 },
  { name: "android-icon-192x192.png", size: 192 },
  { name: "android-icon-512x512.png", size: 512 },
  // Variante maskable para Android (zona segura del 80% central).
  { name: "android-icon-512x512-maskable.png", size: 512, maskable: true },
  { name: "apple-icon.png", size: 180 },
  { name: "apple-icon-precomposed.png", size: 180 },
];

async function main() {
  if (!existsSync(svgPath)) {
    throw new Error(`No se encontro el SVG origen: ${svgPath}`);
  }

  // Importaciones dinamicas para que el script falle rapido si falta instalar deps.
  const sharpModule = await import("sharp").catch(() => null);
  const toIcoModule = await import("to-ico").catch(() => null);

  if (!sharpModule) {
    throw new Error(
      "Falta la dependencia 'sharp'. Instala con: npm install --no-save sharp",
    );
  }
  if (!toIcoModule) {
    throw new Error(
      "Falta la dependencia 'to-ico'. Instala con: npm install --no-save to-ico",
    );
  }

  const sharp = sharpModule.default;
  const toIco = toIcoModule.default;

  await mkdir(outDir, { recursive: true });

  // Render base del SVG -> PNG. Tomamos el tamano del icono mas grande
  // (1024) y hacemos resize por cada tamano destino para que la imagen
  // se vea lo mas nitida posible al achicarse.
  const masterBuffer = await sharp(svgPath)
    .resize(1024, 1024, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Genera todos los PNGs en sus tamanos nativos (transparentes).
  for (const { name, size, maskable = false } of sizes) {
    const outPath = path.join(outDir, name);
    // Para la variante maskable, escalamos la imagen al 80% centrada
    // sobre un lienzo del tamano destino. Asi Android puede recortarla
    // sin que el icono principal se pierda.
    const targetFit = maskable
      ? { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, position: "centre" }
      : { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } };
    const resizeArgs = maskable
      ? { width: Math.round(size * 0.8), height: Math.round(size * 0.8), ...targetFit }
      : { width: size, height: size, ...targetFit };
    await sharp(masterBuffer)
      .resize(resizeArgs)
      .png()
      .toFile(outPath);
    console.log(`  png  ${size}x${size}${maskable ? " (maskable)" : ""}  -> ${path.relative(projectRoot, outPath)}`);
  }

  // Empaqueta las versiones mas usadas (16, 32, 48, 64, 256) en un unico
  // favicon.ico multi-resolucion. Cubrir hasta 256x256 hace que en bookmarks
  // y en Windows taskbar se vea con la maxima densidad disponible.
  const icoSizes = [16, 32, 48, 64, 256];
  const icoBuffers = await Promise.all(
    icoSizes.map((size) =>
      sharp(masterBuffer)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer(),
    ),
  );
  const icoBuffer = await toIco(icoBuffers);
  const icoPath = path.join(outDir, "favicon.ico");
  await writeFile(icoPath, icoBuffer);
  console.log(`  ico  multi (${icoSizes.join(",")}) -> ${path.relative(projectRoot, icoPath)}`);

  // Manifest compatible con PWA / Android con todos los tamanos disponibles,
  // incluido el icon maskable para adaptive icons en Android.
  const manifest = {
    name: "Skelletary",
    short_name: "Skelletary",
    icons: [
      { src: "/favicon/skelly/android-icon-36x36.png", sizes: "36x36", type: "image/png", density: "0.75" },
      { src: "/favicon/skelly/android-icon-48x48.png", sizes: "48x48", type: "image/png", density: "1.0" },
      { src: "/favicon/skelly/android-icon-72x72.png", sizes: "72x72", type: "image/png", density: "1.5" },
      { src: "/favicon/skelly/android-icon-96x96.png", sizes: "96x96", type: "image/png", density: "2.0" },
      { src: "/favicon/skelly/android-icon-144x144.png", sizes: "144x144", type: "image/png", density: "3.0" },
      { src: "/favicon/skelly/android-icon-192x192.png", sizes: "192x192", type: "image/png", density: "4.0", purpose: "any" },
      { src: "/favicon/skelly/android-icon-512x512.png", sizes: "512x512", type: "image/png", density: "5.0", purpose: "any" },
      { src: "/favicon/skelly/android-icon-512x512-maskable.png", sizes: "512x512", type: "image/png", density: "5.0", purpose: "maskable" },
    ],
  };
  await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`  manifest.json escrito`);

  // browserconfig.xml para IE/Edge legacy.
  const browserconfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/favicon/skelly/ms-icon-70x70.png"/>
      <square150x150logo src="/favicon/skelly/ms-icon-150x150.png"/>
      <wide310x150logo src="/favicon/skelly/ms-icon-310x310.png"/>
      <TileColor>#1a0e2e</TileColor>
    </tile>
  </msapplication>
</browserconfig>
`;
  await writeFile(path.join(outDir, "browserconfig.xml"), browserconfig);
  console.log(`  browserconfig.xml escrito`);

  // Limpia la carpeta vieja con hash autogenerado si existe, para no
  // dejar basura en public/ que ademas ya estaria versionada.
  const legacyDir = path.join(projectRoot, "public", "favicon", "4f0c88df163714a0a8b5a774b119069e.ico");
  if (existsSync(legacyDir)) {
    await rm(legacyDir, { recursive: true, force: true });
    console.log(`  carpeta legacy eliminada: ${path.relative(projectRoot, legacyDir)}`);
  }

  console.log("\nListo. Favicons regenerados en public/favicon/skelly/");
}

main().catch((error) => {
  console.error("Error generando favicons:", error);
  process.exit(1);
});