import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for saved session (VULN: JWT in localStorage)
    const saved = localStorage.getItem('kronos_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  // VULN: Broken Authentication — custom auth using plain text password comparison
  // No rate limiting, no bcrypt, no proper session management
  const login = async (email, password) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('password_plain', password)  // VULN: comparing plaintext passwords
      .single()

    if (error || !data) {
      throw new Error('Credenciais inválidas')
    }

    // VULN: storing full user object including sensitive data in localStorage
    localStorage.setItem('kronos_user', JSON.stringify(data))
    setUser(data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('kronos_user')
    setUser(null)
  }

  // VULN: Mass Assignment — update profile allows changing any field including 'role'
  const updateProfile = async (updates) => {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)  // VULN: no field filtering, client can send { role: 'admin' }
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      localStorage.setItem('kronos_user', JSON.stringify(data))
      setUser(data)
    }
    return { data, error }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
