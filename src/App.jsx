import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Timesheet from './pages/Timesheet'
import Analytics from './pages/Analytics'
import Requests from './pages/Requests'
import Preferences from './pages/Preferences'
import Support from './pages/Support'
import AppShell from './components/AppShell'
import Toast from './components/Toast'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="loading-screen">Carregando...</div>

  return (
    <>
      <Toast />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route element={user ? <AppShell /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="/timesheet" element={<Timesheet />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/support" element={<Support />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}
