import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('kronos_theme')
    if (stored) return stored
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
      const handler = (e) => root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      root.setAttribute('data-theme', theme)
    }
    localStorage.setItem('kronos_theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
