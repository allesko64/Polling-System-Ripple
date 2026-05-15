import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom'
import api from './lib/api'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import CreatePoll from './pages/CreatePoll'
import Home from './pages/Home'
import Login from './pages/Login'
import PollPage from './pages/PollPage'
import Register from './pages/Register'
import ThankYou from './pages/ThankYou'
import PublishedResults from './pages/PublishedResults'
import Account from './pages/Account'
import { useAuthStore } from './lib/store'

function PageFadeLayout() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="animate-page-fade" style={{ minHeight: '100%' }}>
      <Outlet />
    </div>
  )
}
function ProtectedRoute(){
  const accessToken = useAuthStore((state) => state.accessToken)
  const authHydrated = useAuthStore((state) => state.authHydrated)

  if (!authHydrated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAF9' }}>
        <span style={{ color: '#57534E', fontSize: '0.9rem' }}>Loading…</span>
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function App() {
  const { setAccessToken, setUser, setAuthHydrated } = useAuthStore()

  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const { data } = await api.post('/auth/refresh')
        setAccessToken(data.accessToken)
        if (data.user) setUser(data.user)
      } catch {
        // not logged in — httpOnly cookie absent or expired
      } finally {
        setAuthHydrated(true)
      }
    }
    void tryRefresh()
  }, [setAccessToken, setUser, setAuthHydrated])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PageFadeLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />} >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/polls/create" element={<CreatePoll />} />
            <Route path="/polls/:pollId/analytics" element={<Analytics />} />
            <Route path="/account" element={<Account />} />
          </Route>
          <Route path="/poll/:pollId" element={<PollPage />} />
          <Route path="/poll/:pollId/thank-you" element={<ThankYou />} />
          <Route path="/polls/:pollId/results" element={<PublishedResults />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
