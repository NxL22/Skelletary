import { Temporal } from "@js-temporal/polyfill";

export const ACCESS_STATUS = {
  trial: "trial",
  active: "active",
  expired: "expired",
  pending: "pending",
};

function getLocalTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function toDateValue(value) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getAccessDeadlineTimestamp(profile) {
  if (!profile) {
    return null;
  }

  return profile.accessStatus === ACCESS_STATUS.active
    ? toDateValue(profile.subscriptionEndsAt)
    : toDateValue(profile.trialEndsAt);
}

function getAccessDeadlineZonedDateTime(profile) {
  const deadline = getAccessDeadlineTimestamp(profile);

  if (!deadline) {
    return null;
  }

  // Para la UX contamos dias por fecha calendario local, no por milisegundos.
  // Asi "vence mañana" cambia cuando cambia el dia del usuario, no segun la hora exacta.
  return Temporal.Instant.fromEpochMilliseconds(deadline).toZonedDateTimeISO(getLocalTimeZone());
}

export function normalizeProfile(profile) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email || profile.user_email || "",
    displayName: profile.display_name || "",
    hasCoreLibrary: profile.has_core_library ?? true,
    accessStatus: profile.access_status || ACCESS_STATUS.pending,
    trialStartsAt: profile.trial_starts_at || null,
    trialEndsAt: profile.trial_ends_at || null,
    subscriptionEndsAt: profile.subscription_ends_at || null,
    createdAt: profile.created_at || null,
    updatedAt: profile.updated_at || null,
  };
}

export function resolveAccessState(profile) {
  if (!profile) {
    return {
      status: ACCESS_STATUS.pending,
      hasAccess: false,
      label: "Pendiente de activacion",
      detail: "Tu cuenta existe, pero aun no ha sido activada manualmente.",
    };
  }

  const now = Date.now();
  const trialEndsAt = toDateValue(profile.trialEndsAt);
  const subscriptionEndsAt = toDateValue(profile.subscriptionEndsAt);

  if (profile.accessStatus === ACCESS_STATUS.pending) {
    return {
      status: ACCESS_STATUS.pending,
      hasAccess: false,
      label: "Pendiente de activacion",
      detail: "Tu cuenta ya existe, pero aun no ha sido activada manualmente.",
    };
  }

  if (profile.accessStatus === ACCESS_STATUS.active) {
    const hasAccess = !subscriptionEndsAt || subscriptionEndsAt > now;
    return {
      status: hasAccess ? ACCESS_STATUS.active : ACCESS_STATUS.expired,
      hasAccess,
      label: hasAccess ? "Suscripcion activa" : "Suscripcion vencida",
      detail: hasAccess
        ? "Tu cuenta esta habilitada para usar Skelletary."
        : "Tu suscripcion anual vencio. Debes renovarla para volver a entrar.",
    };
  }

  if (profile.accessStatus === ACCESS_STATUS.trial) {
    const hasAccess = !trialEndsAt || trialEndsAt > now;
    return {
      status: hasAccess ? ACCESS_STATUS.trial : ACCESS_STATUS.expired,
      hasAccess,
      label: hasAccess ? "Prueba activa" : "Prueba vencida",
      detail: hasAccess
        ? "Tu prueba de 15 dias esta activa."
        : "Tu prueba de 15 dias termino. Debes pasar a una cuenta activa.",
    };
  }

  return {
    status: ACCESS_STATUS.expired,
    hasAccess: false,
    label: "Acceso inactivo",
    detail: "Tu cuenta no tiene acceso vigente en este momento.",
  };
}

export function formatAccessDeadline(profile) {
  const deadline = getAccessDeadlineZonedDateTime(profile);

  if (!deadline) {
    return "Sin fecha";
  }

  return deadline.toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getRemainingAccessDays(profile) {
  const deadline = getAccessDeadlineZonedDateTime(profile);

  if (!deadline) {
    return null;
  }

  const today = Temporal.Now.plainDateISO(getLocalTimeZone());
  const dueDate = deadline.toPlainDate();

  if (Temporal.PlainDate.compare(dueDate, today) <= 0) {
    return 0;
  }

  return today.until(dueDate, { largestUnit: "day" }).days;
}

export function getProfileDisplayName(profile) {
  return (
    profile?.displayName?.trim() ||
    profile?.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim() ||
    "Tu cuenta"
  );
}

export function getAccessCountdownLabel(profile, accessState) {
  const remainingAccessDays = getRemainingAccessDays(profile);

  if (remainingAccessDays === null) {
    return accessState?.label || "Acceso pendiente";
  }

  if (remainingAccessDays === 0) {
    return "Vence hoy";
  }

  if (remainingAccessDays === 1) {
    return "Queda 1 dia";
  }

  return `Quedan ${remainingAccessDays} dias`;
}
