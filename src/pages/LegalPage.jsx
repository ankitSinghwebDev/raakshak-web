import { useEffect } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import './LegalPage.css'

const PRIVACY_SECTIONS = [
  {
    heading: 'Information We Collect',
    body: 'Rakshak collects the minimum information required to help vehicle owners respond to emergencies, parking alerts, and roadside incidents. This includes your name, registered mobile number, vehicle registration number, emergency contacts, and optional documents you choose to store in Smart Vault. All vault documents are encrypted in your browser before they ever reach our servers. [Replace with your legal copy.]',
  },
  {
    heading: 'How We Use Your Information',
    body: 'We use your information to generate your personalized Rakshak QR sticker, to relay scan-time messages to you securely, and to notify your emergency contacts when you trigger an SOS alert. We do not sell your personal information to third parties. [Replace with your legal copy.]',
  },
  {
    heading: 'Data Security',
    body: 'Smart Vault documents are encrypted client-side using your PIN-derived key before upload. Your PIN itself is never sent to our servers — only a PBKDF2 hash is stored for verification. Scan messages are routed through Firebase Realtime Database with server-side rules enforcing authentication. [Replace with your legal copy.]',
  },
  {
    heading: 'Your Rights',
    body: 'You can request deletion of your account and all associated data at any time by contacting support. You can remove individual documents from your Smart Vault directly from your dashboard. [Replace with your legal copy.]',
  },
  {
    heading: 'Contact',
    body: 'For any privacy-related questions, contact us at support@rakshak.co.in. [Replace with your legal copy.]',
  },
]

const TERMS_SECTIONS = [
  {
    heading: 'Acceptance of Terms',
    body: 'By registering a Rakshak account or using any Rakshak service, you agree to these Terms & Conditions. If you do not agree, please do not use the service. [Replace with your legal copy.]',
  },
  {
    heading: 'Service Description',
    body: 'Rakshak provides a QR-based vehicle safety and emergency response platform. Services include Smart QR sticker generation, scan-time messaging between citizens and vehicle owners, SOS broadcasts, Smart Vault document storage, and related tools. [Replace with your legal copy.]',
  },
  {
    heading: 'User Responsibilities',
    body: 'You agree to provide accurate information during registration, to keep your account credentials secure, and to use Rakshak only for lawful purposes. Misuse of emergency features may result in account suspension. [Replace with your legal copy.]',
  },
  {
    heading: 'Limitation of Liability',
    body: 'Rakshak is a communication facilitator and not a replacement for official emergency services. In any genuine medical or law-enforcement emergency, please call 100 (Police) or 108 (Ambulance) directly. Rakshak is not liable for delays or failures in third-party messaging networks. [Replace with your legal copy.]',
  },
  {
    heading: 'Modifications',
    body: 'Rakshak may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms. [Replace with your legal copy.]',
  },
  {
    heading: 'Contact',
    body: 'For any questions about these terms, contact us at support@rakshak.co.in. [Replace with your legal copy.]',
  },
]

const LegalPage = () => {
  const location = useLocation()
  const type = location.pathname === '/privacy' ? 'privacy'
    : location.pathname === '/terms' ? 'terms'
    : null

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [type])

  if (!type) {
    return <Navigate to="/" replace />
  }

  const isPrivacy = type === 'privacy'
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions'
  const sections = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS

  return (
    <div className="legal-page">
      <Helmet>
        <title>{title} - Rakshak</title>
        <meta name="description" content={`${title} for Rakshak vehicle safety platform.`} />
      </Helmet>

      <div className="legal-container">
        <Link to="/" className="legal-back">← Back to Home</Link>

        <h1 className="legal-title">{title}</h1>
        <p className="legal-meta">Last updated: 2026-04-11</p>

        <div className="legal-intro">
          This is placeholder legal text. Replace with your finalized {title.toLowerCase()} before going live.
        </div>

        {sections.map((section, i) => (
          <section key={i} className="legal-section">
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        <div className="legal-footer">
          <Link to={isPrivacy ? '/terms' : '/privacy'} className="legal-switch">
            Read the {isPrivacy ? 'Terms & Conditions' : 'Privacy Policy'} →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LegalPage
