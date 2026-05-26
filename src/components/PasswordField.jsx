import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function PasswordField({
  value,
  onChange,
  inputClassName = "",
  wrapperClassName = "",
  toggleClassName = "",
  leadingAdornment = null,
  secretLabel = "contraseña",
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);
  const toggleLabel = visible ? `Ocultar ${secretLabel}` : `Mostrar ${secretLabel}`;

  return (
    <div className={`group relative ${wrapperClassName}`.trim()}>
      {leadingAdornment}
      <input
        {...inputProps}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        className={`${inputClassName} pr-14`.trim()}
      />
      {/* Unificamos este ojo para que login, recuperación y PIN respondan igual. */}
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className={`absolute inset-y-0 right-4 inline-flex items-center text-slate-400 transition hover:text-cyan focus:outline-none focus:text-cyan ${toggleClassName}`.trim()}
        aria-label={toggleLabel}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
