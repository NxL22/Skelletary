import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  return argv.reduce((accumulator, entry) => {
    if (!entry.startsWith("--")) {
      return accumulator;
    }

    const [rawKey, ...rest] = entry.slice(2).split("=");
    const key = rawKey.trim();
    const value = rest.length ? rest.join("=").trim() : "true";

    if (key) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

function printUsage() {
  console.log(`
Uso:
  npm run user:create -- --email=usuario@clinica.com --access=trial --share-core=true --name="Dra. Ejemplo"

Opciones:
  --email=...                 Correo del usuario. Obligatorio.
  --password=...              Crea o reemplaza la contrasena sin enviar correo.
  --name=...                  Nombre visible para guardar en profiles.
  --access=pending|trial|active
                              Estado comercial inicial. Por defecto: trial.
  --resend=auto|invite|recovery|none
                              Estrategia de reenvio si la cuenta ya existe. Por defecto: auto.
                              Con --password, por defecto no envia correo.
  --share-core=true|false     Decide si recibe la biblioteca oficial. Por defecto: true.
  --trial-days=15             Duracion de la prueba si access=trial.
  --subscription-days=365     Duracion si access=active.
  --app-url=https://skelletary.com
                              URL publica de la app para el enlace del correo.
  --help                      Muestra esta ayuda.
`);
}

function normalizeAccess(accessValue) {
  const normalized = String(accessValue || "trial").toLowerCase();

  if (["pending", "trial", "active"].includes(normalized)) {
    return normalized;
  }

  throw new Error("El parametro --access debe ser pending, trial o active.");
}

function toPositiveInteger(value, fallbackValue) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? Math.trunc(parsedValue) : fallbackValue;
}

function normalizeBooleanFlag(value, fallbackValue = true) {
  if (value === undefined) {
    return fallbackValue;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "si", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }

  throw new Error("El parametro booleano debe ser true o false.");
}

function normalizeResendMode(value) {
  const normalized = String(value || "auto").trim().toLowerCase();

  if (["auto", "invite", "recovery", "none"].includes(normalized)) {
    return normalized;
  }

  throw new Error("El parametro --resend debe ser auto, invite, recovery o none.");
}

function normalizePassword(value) {
  const password = String(value || "");

  if (!password) {
    return "";
  }

  if (password.trim().length < 8) {
    throw new Error("La contrasena indicada en --password debe tener al menos 8 caracteres.");
  }

  return password;
}

function buildProfilePayload({
  access,
  displayName,
  email,
  hasCoreLibrary,
  now,
  subscriptionDays,
  trialDays,
  userId,
}) {
  const payload = {
    id: userId,
    email,
    display_name: displayName,
    has_core_library: hasCoreLibrary,
    access_status: access,
    trial_starts_at: null,
    trial_ends_at: null,
    subscription_ends_at: null,
  };

  if (access === "trial") {
    payload.trial_starts_at = now.toISOString();
    payload.trial_ends_at = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000).toISOString();
  }

  if (access === "active") {
    payload.subscription_ends_at = new Date(
      now.getTime() + subscriptionDays * 24 * 60 * 60 * 1000,
    ).toISOString();
  }

  return payload;
}

async function findExistingUserByEmail(supabase, email) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw error;
  }

  return (
    data.users.find(
      (user) => String(user.email || "").trim().toLowerCase() === String(email).trim().toLowerCase(),
    ) || null
  );
}

async function sendRecoveryEmail({ appUrl, email, publishableKey, supabaseUrl }) {
  const publicSupabase = createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await publicSupabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}?auth_mode=recovery`,
  });

  if (error) {
    throw error;
  }
}

async function createUserWithPassword({ email, password, supabase, userMetadata }) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (error) {
    throw error;
  }

  return data.user;
}

async function updateUserPasswordById({ password, supabase, userId }) {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });

  if (error) {
    throw error;
  }

  return data.user;
}

loadEnvFile(resolve(process.cwd(), ".env"));

const args = parseArgs(process.argv.slice(2));

if (args.help || args.h === "true") {
  printUsage();
  process.exit(0);
}

const email = String(args.email || "").trim().toLowerCase();
const directPassword = normalizePassword(args.password);
const displayName = String(args.name || "").trim();
const access = normalizeAccess(args.access);
const resendMode = normalizeResendMode(args.resend || (directPassword ? "none" : "auto"));
const hasCoreLibrary = normalizeBooleanFlag(args["share-core"], true);
const trialDays = toPositiveInteger(args["trial-days"], 15);
const subscriptionDays = toPositiveInteger(args["subscription-days"], 365);
const appUrl = String(args["app-url"] || process.env.SKELLETARY_APP_URL || process.env.VITE_APP_URL || "")
  .trim()
  .replace(/\/$/, "");
const needsEmailRedirect = !directPassword || resendMode !== "none";

if (!email) {
  printUsage();
  throw new Error("Debes indicar el correo con --email.");
}

if (needsEmailRedirect && !appUrl) {
  throw new Error(
    "Debes definir SKELLETARY_APP_URL, VITE_APP_URL o --app-url para evitar correos que apunten a localhost.",
  );
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !publishableKey || !serviceRoleKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY o una clave administrativa en tu .env.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const redirectTo = appUrl ? `${appUrl}?auth_mode=invite` : "";
const inviteMetadata = displayName ? { display_name: displayName } : undefined;

try {
  const existingUser = await findExistingUserByEmail(supabase, email);
  let invitedUser = existingUser;
  let usedExistingUser = false;
  let sentEmailMode = null;
  let inviteError = null;
  let passwordWasSet = false;

  if (directPassword && existingUser?.id) {
    invitedUser = await updateUserPasswordById({
      password: directPassword,
      supabase,
      userId: existingUser.id,
    });
    passwordWasSet = true;
  }

  if (directPassword && !existingUser) {
    // Este camino evita el correo de invitacion cuando Supabase tiene rate limit.
    invitedUser = await createUserWithPassword({
      email,
      password: directPassword,
      supabase,
      userMetadata: inviteMetadata,
    });
    passwordWasSet = true;
  }

  if (!directPassword && (!existingUser || resendMode === "invite")) {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: inviteMetadata,
      redirectTo,
    });

    if (!error) {
      invitedUser = data.user || invitedUser;
      sentEmailMode = "invite";
    } else {
      inviteError = error;
    }
  }

  if (!invitedUser?.id) {
    if (inviteError) {
      throw inviteError;
    }

    throw new Error("No pudimos encontrar ni crear la cuenta en Supabase Auth.");
  }

  usedExistingUser = Boolean(existingUser);

  if (usedExistingUser && !directPassword && resendMode !== "none" && sentEmailMode !== "invite") {
    // Para cuentas que ya existen, el correo de recuperacion es la via mas confiable
    // para reenviar un acceso real sin depender de que Supabase reprocesa una invitacion.
    if (resendMode === "auto" || resendMode === "recovery" || resendMode === "invite") {
      await sendRecoveryEmail({
        appUrl,
        email,
        publishableKey,
        supabaseUrl,
      });
      sentEmailMode = "recovery";
    }
  }

  // Dejamos el perfil comercial listo al momento de invitar para que el correo
  // de alta y el primer ingreso ya apunten al estado correcto de la cuenta.
  const profilePayload = buildProfilePayload({
    access,
    displayName,
    email,
    hasCoreLibrary,
    now: new Date(),
    subscriptionDays,
    trialDays,
    userId: invitedUser.id,
  });

  const { error: profileError } = await supabase.from("profiles").upsert(profilePayload, {
    onConflict: "id",
  });

  if (profileError) {
    throw profileError;
  }

  console.log(
    usedExistingUser
      ? "La cuenta ya existia. Actualizamos su perfil en Skelletary."
      : directPassword
        ? "Cuenta creada con contrasena directa."
        : "Invitacion enviada con exito.",
  );
  console.log(`Correo: ${email}`);
  console.log(`Estado inicial: ${access}`);
  console.log(
    `Biblioteca oficial: ${hasCoreLibrary ? "compartida con este usuario" : "no compartida"}`,
  );
  if (redirectTo) {
    console.log(`Redirect principal: ${redirectTo}`);
  }

  if (sentEmailMode === "invite") {
    console.log("Correo enviado: invitacion para crear contraseña.");
  } else if (sentEmailMode === "recovery") {
    console.log("Correo enviado: recuperacion para crear o cambiar contraseña.");
  } else {
    console.log("Correo enviado: no se envio ninguno en esta ejecucion.");
  }

  if (passwordWasSet) {
    console.log("Contrasena directa: configurada por el owner.");
  }

  if (usedExistingUser) {
    console.log("Nota: la cuenta ya existia en Supabase Auth.");
  }

  if (inviteError && sentEmailMode === "recovery") {
    console.log(
      "Nota: no pudimos reutilizar la invitacion original, asi que enviamos un correo de recuperacion.",
    );
  }

  if (access === "trial") {
    console.log(`Prueba configurada por ${trialDays} dias.`);
  }

  if (access === "active") {
    console.log(`Suscripcion configurada por ${subscriptionDays} dias.`);
  }
} catch (error) {
  console.error("No pudimos crear la cuenta.");
  console.error(error?.message || error);
  process.exit(1);
}
