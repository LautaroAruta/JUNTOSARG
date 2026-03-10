import { useState, useEffect } from 'react'
import { supabase, signIn, signUp, signOut, signInWithGoogle } from './lib/supabase.js'

// ── Importar la app completa ──────────────────
// (temporalmente usamos la versión v2 como base)
// Cuando conectes Supabase, reemplazá las llamadas
// de datos hardcodeados por los helpers de supabase.js
import JuntoAppInner from './JuntoApp.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sesión existente al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Escuchar cambios de auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0B1D3A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16
      }}>
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle cx="18" cy="22" r="9" fill="#1651E0"/>
          <ellipse cx="18" cy="40" rx="13" ry="10" fill="#1651E0"/>
          <circle cx="42" cy="22" r="9" fill="#1651E0"/>
          <ellipse cx="42" cy="40" rx="13" ry="10" fill="#1651E0"/>
          <circle cx="50" cy="10" r="11" fill="#22C55E"/>
        </svg>
        <div style={{ color: '#93C5FD', fontSize: 14, fontFamily: 'sans-serif' }}>
          Cargando JUNTO...
        </div>
      </div>
    )
  }

  // Pasar el usuario de Supabase a la app interna
  // La app v2 ya maneja su propio estado de auth internamente
  // con datos demo — cuando conectes Supabase real, usá session.user
  return <JuntoAppInner supabaseSession={session} supabaseSignOut={signOut} />
}
