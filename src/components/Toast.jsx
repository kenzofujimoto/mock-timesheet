import { useState, useEffect, createContext, useContext } from 'react'

const ToastContext = createContext()

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const show = (text) => { setMsg(text); setTimeout(() => setMsg(null), 3000) }
  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg && (
        <div className="toast" style={{ display: 'flex' }}>
          <span className="material-symbols-outlined toast-icon">check_circle</span>
          <span className="toast-message">{msg}</span>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export default function Toast() {
  // This is a placeholder — the real toast is in ToastProvider
  return null
}
