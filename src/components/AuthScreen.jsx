import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AUTH_REDIRECT_MODE } from "../lib/auth";
import PasswordField from "./PasswordField";

const LOGIN_BACKGROUND_IMAGE = "/fondo%20del%20login/login-radiografia.png";

function getPublicAssetPath(relativePath) {
  // Armamos la URL desde `public/` para que la imagen funcione igual
  // en local y si la app termina publicada dentro de una subruta.
  const normalizedPath = relativePath.replace(/^\/+/, "");
  return `${import.meta.env.BASE_URL}${encodeURI(normalizedPath)}`;
}

const LOGIN_MASCOT_IMAGE = getPublicAssetPath("imagenes de Skelly/skelly_login.png");

function getStatusLabel({ accessState, authMode, hasSession, loading }) {
  if (loading) {
    return "Preparando acceso";
  }

  if (authMode === AUTH_REDIRECT_MODE.invite) {
    return "Invitación activa";
  }

  if (authMode === AUTH_REDIRECT_MODE.recovery) {
    return "Recuperación segura";
  }

  if (!hasSession) {
    return "Acceso privado";
  }

  return accessState?.label || "Cuenta detectada";
}

function getHeadline({ accessState, authMode, backendConfigured, hasSession, loading, panelMode }) {
  if (!backendConfigured) {
    return {
      eyebrow: "Configuración pendiente",
      title: "Falta encender el backend",
      description:
        "Skelletary necesita Supabase para autenticar usuarios, restaurar contraseñas y cargar bibliotecas personales.",
    };
  }

  if (loading) {
    return {
      eyebrow: "Sincronización",
      title: "Estamos validando tu acceso",
      description:
        "Revisamos la sesión y preparamos la biblioteca para que entres con el estado correcto desde el primer segundo.",
    };
  }

  if (authMode === AUTH_REDIRECT_MODE.invite) {
    return hasSession
      ? {
          eyebrow: "Cuenta creada por Skelletary",
          title: "Ahora crea tu contraseña",
          description:
            "Tu cuenta ya existe. Solo falta definir tu contraseña para dejar el acceso listo y profesional.",
        }
      : {
          eyebrow: "Invitación expirada",
          title: "Vuelve a pedir la invitación",
          description:
            "El enlace ya no trajo una sesión válida. Reenvía la invitación desde tu panel de owner para continuar.",
        };
  }

  if (authMode === AUTH_REDIRECT_MODE.recovery) {
    return hasSession
      ? {
          eyebrow: "Recuperación de acceso",
          title: "Define una contraseña nueva",
          description:
            "En cuanto la guardes, tu cuenta podrá volver a entrar con email y contraseña.",
        }
      : {
          eyebrow: "Recuperación incompleta",
          title: "El enlace ya no está activo",
          description:
            "Solicita otro correo de recuperación para volver a cambiar la contraseña de forma segura.",
        };
  }

  if (!hasSession && panelMode === "forgot") {
    return {
      eyebrow: "Recuperación de acceso",
      title: "¿Olvidaste tu contraseña?",
      description:
        "Escribe el correo de tu cuenta y te enviaremos un enlace seguro para recuperar el acceso.",
    };
  }

  if (!hasSession) {
    return {
      eyebrow: "Acceso privado",
      title: "Bienvenido de nuevo",
      description: "Ingresa tus credenciales para continuar.",
    };
  }

  if (accessState?.status === "pending") {
    return {
      eyebrow: "Cuenta creada",
      title: "Tu acceso sigue pendiente de activación",
      description:
        "La cuenta ya existe, pero todavía no está habilitada para abrir la app. Puedes cerrar sesión o cambiar tu contraseña si hace falta.",
    };
  }

  return {
    eyebrow: "Acceso no vigente",
    title: "Tu cuenta no puede entrar todavía",
    description:
      "La sesión está bien, pero el estado comercial de esta cuenta no permite abrir Skelletary en este momento.",
  };
}

function InlineFeedback({ tone, children }) {
  const toneMap = {
    success: {
      icon: CheckCircle2,
      className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-50",
    },
    error: {
      icon: AlertTriangle,
      className: "border-rose/30 bg-rose/10 text-rose-50",
    },
    info: {
      icon: Mail,
      className: "border-cyan/20 bg-cyan/10 text-slate-100",
    },
  };
  const resolvedTone = toneMap[tone] || toneMap.info;
  const Icon = resolvedTone.icon;

  return (
    <div
      className={`flex items-start gap-3 rounded-[18px] border px-4 py-3 text-sm leading-6 ${resolvedTone.className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function InputLeadingIcon({ icon: Icon }) {
  return (
    <>
      <Icon className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition group-focus-within:text-cyan" />
      <span className="pointer-events-none absolute left-[3.2rem] top-1/2 h-5 w-px -translate-y-1/2 bg-white/10" />
    </>
  );
}

function LoginBrandBadge() {
  return (
    <div className="relative shrink-0">
      <div className="absolute -inset-2 rounded-full bg-cyan/24 blur-2xl" />
      <div className="login-brand-box relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.035))] p-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_30px_rgba(3,10,18,0.34)] md:h-[4.8rem] md:w-[4.8rem]">
        <div className="relative h-full w-full overflow-hidden rounded-full border border-cyan/12 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f7fbff_55%,#e7f0f7_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
          {/* Avatar de Skelly centrado sin zoom excesivo, se ve natural. */}
          <img
            src={LOGIN_MASCOT_IMAGE}
            alt="Skelly en el acceso de Skelletary"
            className="h-full w-full scale-[1.4] object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
}

export default function AuthScreen({
  accessState,
  authMode = AUTH_REDIRECT_MODE.default,
  backendConfigured,
  loading = false,
  onPasswordRecovery,
  onSignOut,
  onSubmit,
  onUpdatePassword,
  session,
}) {
  const [panelMode, setPanelMode] = useState("login");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [password, setPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);
  const hasSession = Boolean(session?.user?.id);
  const currentYear = new Date().getFullYear();

  const shouldShowPasswordSetup =
    authMode === AUTH_REDIRECT_MODE.invite || authMode === AUTH_REDIRECT_MODE.recovery;
  const isDefaultLoginView = !loading && !shouldShowPasswordSetup && !hasSession && panelMode === "login";

  // En el login base comprimimos el copy para acercarnos al mockup de referencia,
  // pero los flujos especiales conservan contexto porque llegan desde un correo.
  const headline = useMemo(
    () =>
      getHeadline({
        accessState,
        authMode,
        backendConfigured,
        hasSession,
        loading,
        panelMode,
      }),
    [accessState, authMode, backendConfigured, hasSession, loading, panelMode],
  );

  useEffect(() => {
    setEmail(session?.user?.email || "");
    setPassword("");
    setNextPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setSending(false);

    if (authMode === AUTH_REDIRECT_MODE.default) {
      setPanelMode("login");
    }
  }, [authMode, session?.user?.email, session?.user?.id]);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }

    setSending(true);
    resetMessages();

    try {
      await onSubmit({
        email: email.trim(),
        password: password.trim(),
      });
    } catch (submitError) {
      setError(submitError.message || "No pudimos iniciar sesión.");
      setSending(false);
    }
  }

  async function handleRecoveryRequest(event) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Escribe el correo al que enviaremos la recuperación.");
      return;
    }

    setSending(true);
    resetMessages();

    try {
      await onPasswordRecovery(email.trim());
      setSuccess("Te enviamos un correo para cambiar tu contraseña.");
    } catch (submitError) {
      setError(submitError.message || "No pudimos enviar el correo de recuperación.");
    } finally {
      setSending(false);
    }
  }

  async function handlePasswordSetup(event) {
    event.preventDefault();

    if (nextPassword.trim().length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setError("La confirmación no coincide.");
      return;
    }

    setSending(true);
    resetMessages();

    try {
      await onUpdatePassword(nextPassword.trim());
      setSuccess("La contraseña ya quedó guardada.");
      setNextPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(submitError.message || "No pudimos guardar la nueva contraseña.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative min-h-[100svh] overflow-x-hidden overflow-y-auto bg-[#020609] text-white">
      {/* Fijamos el fondo al viewport para que la radiografia no se mueva
          aunque la caja necesite mas alto y aparezca scroll. */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${LOGIN_BACKGROUND_IMAGE}")` }}
      />
      <div className="fixed inset-0 bg-[linear-gradient(110deg,rgba(2,7,13,0.9)_6%,rgba(3,10,16,0.72)_40%,rgba(1,5,10,0.94)_100%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(95,179,244,0.14),transparent_26%),radial-gradient(circle_at_78%_55%,rgba(60,156,255,0.1),transparent_24%)]" />
      <div className="login-noise fixed inset-0 opacity-[0.05]" />
      <div className="login-blob fixed -left-24 top-[-140px] h-[320px] w-[320px] rounded-full bg-cyan/15 blur-3xl" />
      <div className="login-blob login-blob-delay-1 fixed bottom-[-120px] right-[-80px] h-[280px] w-[280px] rounded-full bg-sky-400/12 blur-3xl" />

      <div className="login-shell relative mx-auto flex min-h-[100svh] w-full max-w-[1240px] items-center justify-center px-4 py-6 sm:px-6 lg:px-10">
        <div className="login-desktop-scale relative w-full max-w-[460px] md:max-w-[34.5rem]">
          <div className="login-card px-6 pb-[calc(1.5rem+1em)] pt-6 sm:px-9 sm:pb-[calc(2.25rem+0.5em)] sm:pt-9 md:px-10 md:pb-8 md:pt-8">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="flex items-start gap-4">
              <LoginBrandBadge />

              <div className="pt-1">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan/95">
                  <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_18px_rgba(54,214,222,0.85)]" />
                  {getStatusLabel({ accessState, authMode, hasSession, loading })}
                </span>
                <p className="mt-3 font-display text-[2rem] font-semibold leading-none tracking-[-0.03em] text-white">
                  Skelletary
                </p>
              </div>
            </div>

            <div className="login-heading-block mt-12 md:mt-8">
              {!isDefaultLoginView ? (
                <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">
                  {headline.eyebrow}
                </p>
              ) : null}
              <h1 className="login-title font-display text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.04em] text-white">
                {headline.title}
              </h1>
              <p className="login-support-copy mt-4 max-w-[30rem] text-[15px] leading-7 text-slate-400">
                {headline.description}
              </p>
            </div>

            {loading ? (
              <div className="mt-8">
                <InlineFeedback tone="info">
                  Estamos sincronizando tu acceso y tu biblioteca profesional.
                </InlineFeedback>
              </div>
            ) : shouldShowPasswordSetup ? (
              hasSession ? (
                <form
                  onSubmit={handlePasswordSetup}
                  className="login-form-stack mt-10 space-y-6 md:mt-8 md:space-y-5"
                >
                  <label className="block">
                    <span className="mb-3 block text-sm font-medium text-slate-200 md:mb-2.5">
                      Nueva contraseña
                    </span>
                    <PasswordField
                      value={nextPassword}
                      onChange={(event) => setNextPassword(event.target.value)}
                      inputClassName="login-field login-field-with-icon"
                      autoComplete="new-password"
                      placeholder="Al menos 8 caracteres"
                      leadingAdornment={<InputLeadingIcon icon={KeyRound} />}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-3 block text-sm font-medium text-slate-200 md:mb-2.5">
                      Confirmar contraseña
                    </span>
                    <PasswordField
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      inputClassName="login-field login-field-with-icon"
                      autoComplete="new-password"
                      placeholder="Repite la contraseña"
                      leadingAdornment={<InputLeadingIcon icon={LockKeyhole} />}
                    />
                  </label>

                  {success ? <InlineFeedback tone="success">{success}</InlineFeedback> : null}
                  {error ? <InlineFeedback tone="error">{error}</InlineFeedback> : null}

                  <button
                    type="submit"
                    className="login-primary-button w-full md:mx-auto md:flex md:w-[90%]"
                    disabled={sending}
                  >
                    <span className="relative flex items-center gap-2">
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          Guardar contraseña
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </span>
                  </button>
                </form>
              ) : (
                <div className="mt-8 space-y-5">
                  <InlineFeedback tone="error">
                    Este enlace ya no abrió una sesión válida. Si estabas creando tu contraseña,
                    reenvía la invitación. Si estabas recuperando acceso, pide otro correo de
                    recuperación.
                  </InlineFeedback>

                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setPanelMode("forgot");
                    }}
                    className="login-secondary-button w-full"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Ir a recuperación
                  </button>
                </div>
              )
            ) : !hasSession ? (
              panelMode === "forgot" ? (
                <form
                  onSubmit={handleRecoveryRequest}
                  className="login-form-stack mt-10 space-y-6 md:mt-8 md:space-y-5"
                >
                  <label className="block">
                    <span className="mb-3 block text-sm font-medium text-slate-200 md:mb-2.5">
                      Correo electrónico
                    </span>
                    <div className="group relative">
                      <InputLeadingIcon icon={Mail} />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="login-field login-field-with-icon"
                        autoComplete="email"
                        placeholder="nombre@clinica.com"
                      />
                    </div>
                  </label>

                  {success ? <InlineFeedback tone="success">{success}</InlineFeedback> : null}
                  {error ? <InlineFeedback tone="error">{error}</InlineFeedback> : null}

                  <button
                    type="submit"
                    className="login-primary-button w-full md:mx-auto md:flex md:w-[90%]"
                    disabled={sending}
                  >
                    <span className="relative flex items-center gap-2">
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar recuperación
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setPanelMode("login");
                    }}
                    className="login-secondary-button w-full"
                  >
                    Volver al login
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={handleLogin}
                  className="login-form-stack mt-10 space-y-6 md:mt-8 md:space-y-5"
                >
                  <label className="block">
                    <span className="mb-3 block text-sm font-medium text-slate-200 md:mb-2.5">
                      Correo electrónico
                    </span>
                    <div className="group relative">
                      <InputLeadingIcon icon={Mail} />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="login-field login-field-with-icon"
                        autoComplete="email"
                        placeholder="nombre@clinica.com"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-3 block text-sm font-medium text-slate-200 md:mb-2.5">
                      Contraseña
                    </span>
                    <PasswordField
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      inputClassName="login-field login-field-with-icon"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      leadingAdornment={<InputLeadingIcon icon={LockKeyhole} />}
                    />
                  </label>

                  {success ? <InlineFeedback tone="success">{success}</InlineFeedback> : null}
                  {error ? <InlineFeedback tone="error">{error}</InlineFeedback> : null}

                  <div className="pt-2 md:pt-1">
                    <button
                      type="submit"
                      className="login-primary-button w-full md:mx-auto md:flex md:w-[90%]"
                      disabled={sending}
                    >
                      <span className="relative flex items-center gap-2">
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          <>
                            Entrar
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </span>
                    </button>
                  </div>

                  <div className="pt-2 md:pt-1">
                    <div className="border-t border-white/8" />
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        resetMessages();
                        setPanelMode("forgot");
                      }}
                      className="text-sm text-slate-400 transition hover:text-cyan"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div className="mt-8 space-y-5">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
                    Cuenta actual
                  </p>
                  <p className="mt-3 text-lg font-medium text-white">
                    {session?.user?.email || "Correo no disponible"}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {accessState?.detail ||
                      "Todavía no pudimos confirmar un acceso vigente para esta cuenta."}
                  </p>
                </div>

                {error ? <InlineFeedback tone="error">{error}</InlineFeedback> : null}

                <button
                  type="button"
                  onClick={onSignOut}
                  className="login-primary-button w-full md:mx-auto md:flex md:w-[90%]"
                >
                  <span className="relative flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </span>
                </button>
              </div>
            )}
          </div>

          <p className="login-footer-copy mt-4 pb-4 text-center text-xs tracking-[0.18em] text-slate-500/80">
            © {currentYear} Skelletary
          </p>
        </div>
      </div>
    </div>
  );
}
