import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { Helmet } from 'react-helmet-async'
import HomePage from '../pages/HomePage'
import AboutPage from '../pages/AboutPage'
import LegalPage from '../pages/LegalPage'
import UserDashboard from '../components/Dashboard/UserDashboard'
import ScannerPage from '../components/Scanner/ScannerPage'
import AdminLayout from '../components/Admin/AdminLayout'
import './PageTransition.css'
import About from '../components/Admin/About'

const AnimatedRoutes = () => {
  const location = useLocation()
  const prevPathRef = useRef(null)

  useEffect(() => {
    if (location.hash && prevPathRef.current !== location.pathname + location.hash) {
      prevPathRef.current = location.pathname + location.hash
      setTimeout(() => {
        const el = document.querySelector(location.hash)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [location.pathname, location.hash])

  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route path="/terms" element={<LegalPage />} />
        <Route path="/scan" element={
          <>
            <Helmet>
              <title>Rakshak Scanner - Emergency Response</title>
              <meta name="description" content="Scan Rakshak QR to contact vehicle owner, send parking alerts, or trigger emergency SOS." />
            </Helmet>
            <ScannerPage />
          </>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Helmet>
              <title>Dashboard - Rakshak</title>
              <meta name="description" content="Manage your Rakshak vehicle protection, QR codes, and emergency settings." />
            </Helmet>
            <UserDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={<AdminLayout />} />
        <Route path="/admin/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

const AppRouter = ({ children }) => {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
      {children}
    </BrowserRouter>
  )
}

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAppContext()
  if (!currentUser) return <Navigate to="/" replace />
  return children
}

export default AppRouter
