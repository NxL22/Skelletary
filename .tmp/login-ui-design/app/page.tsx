"use client"

import { useState } from "react"
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Fondo base */}
      <div className="absolute inset-0 bg-background -z-20" />
      
      {/* Efecto Liquid - Blobs animados */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Blob 1 - Grande cyan */}
        <div 
          className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl animate-blob"
          style={{
            background: 'radial-gradient(circle, oklch(0.75 0.14 195) 0%, transparent 70%)',
          }}
        />
        {/* Blob 2 - Mediano azul */}
        <div 
          className="absolute top-1/2 -right-1/4 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl animate-blob animation-delay-2000"
          style={{
            background: 'radial-gradient(circle, oklch(0.55 0.15 240) 0%, transparent 70%)',
          }}
        />
        {/* Blob 3 - Pequeño turquesa */}
        <div 
          className="absolute -bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl animate-blob animation-delay-4000"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.12 180) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Overlay de ruido sutil */}
      <div 
        className="absolute inset-0 -z-5 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Card del Login */}
      <div className="w-full max-w-md relative">
        {/* Glow detrás del card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-3xl blur-xl opacity-50 animate-pulse-slow" />
        
        <div className="relative backdrop-blur-2xl bg-card/60 border border-border/50 rounded-2xl p-8 shadow-2xl shadow-black/30">
          {/* Borde brillante superior */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          {/* Header con Logo */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative group">
              <div className="absolute -inset-1 bg-primary/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative size-14 rounded-xl bg-secondary/80 flex items-center justify-center border border-border/50 overflow-hidden backdrop-blur-sm">
                <span className="text-2xl">🦴</span>
              </div>
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-primary tracking-[0.2em] uppercase">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                Acceso Privado
              </span>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Skelletary</h1>
            </div>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground text-balance leading-tight">
              Bienvenido de nuevo
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground/90">
                Correo electrónico
              </label>
              <div className="relative group">
                <div className={`absolute -inset-0.5 bg-primary/30 rounded-xl blur-md transition-opacity duration-300 ${focusedField === 'email' ? 'opacity-100' : 'opacity-0'}`} />
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="nombre@clinica.com"
                    required
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-input/50 border border-border/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-input/80 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground/90">
                Contraseña
              </label>
              <div className="relative group">
                <div className={`absolute -inset-0.5 bg-primary/30 rounded-xl blur-md transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`} />
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 size-4 transition-colors duration-300 ${focusedField === 'password' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    required
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-input/50 border border-border/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:bg-input/80 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Botón Entrar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full h-12 rounded-xl font-medium flex items-center justify-center gap-2 overflow-hidden group disabled:cursor-not-allowed"
              >
                {/* Fondo del botón con gradiente */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-accent transition-all duration-500 group-hover:scale-105" />
                {/* Efecto de brillo */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
                {/* Texto */}
                <span className="relative text-primary-foreground flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          {/* Separador */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
          </div>

          {/* Link Olvidé contraseña */}
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300 hover:underline underline-offset-4"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Borde brillante inferior */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        </div>

        {/* Footer sutil */}
        <p className="text-center text-xs text-muted-foreground/40 mt-6 tracking-wide">
          © 2024 Skelletary
        </p>
      </div>
    </main>
  )
}
