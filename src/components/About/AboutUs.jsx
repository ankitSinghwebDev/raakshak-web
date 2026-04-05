import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Image, Modal } from 'antd'
import { useAppContext } from '../../context/AppContext'
import useTranslation from '../../i18n/useTranslation'
import Header from '../Header/Header'
import abhishekImg from '../../assets/icons/abhishek.jpg'
import gauravImg from '../../assets/icons/gaurav.jpg'
import ashishImg from '../../assets/icons/Rakshak.jpg'
import yashImg from '../../assets/icons/yash.jpg'
import harshImg from '../../assets/icons/harsh.jpg'
import './AboutUs.css'

const TEAM_MEMBERS = [
  {
    name: 'Abhishek Singh',
    role: 'Founder & CEO',
    image: abhishekImg,
  },
  {
    name: 'Gaurav Kumar',
    role: 'Co-Founder & Head of Ops',
    image: gauravImg,
  },
  {
    name: 'Ashish Dubey',
    role: 'Co-Founder & Strategy',
    image: ashishImg,
  },
  {
    name: 'Yash Upadhyay',
    role: 'Co-Founder & Finance',
    image: yashImg,
  },
  {
    name: 'Hars Kumar',
    role: 'Head of Partnerships',
    image: harshImg,
  },
]

const STATS = [
  { target: 2500, label: 'Vehicles Protected', suffix: '+' },
  { target: 500, label: 'Emergency Alerts Sent', suffix: '+' },
  { target: 100, label: 'Societies Connected', suffix: '+' },
  { target: null, label: 'Safety Network', display: '24/7' },
]

const HOW_IT_WORKS = [
  { badge: 'SECURE', icon: 'qrcode', title: 'Step 1', desc: 'Place the Rakshak QR on the front and rear sides of the vehicle.' },
  { badge: 'SMART', icon: 'expand-arrows-alt', title: 'Step 2', desc: 'Anyone can scan the QR during emergencies like No Parking issues or accidents.' },
  { badge: 'FAST', icon: 'bell', title: 'Step 3', desc: 'Owner receives instant alert via Call or WhatsApp.' },
  { badge: 'HELP', icon: 'shipping-fast', title: 'Step 4', desc: 'Emergency help contacted.' },
]

const USE_CASES = [
  { badge: 'POLITE', icon: 'ambulance', title: 'Accident Emergency', desc: 'Quick contact with family or responders instantly.' },
  { badge: 'POLITE', icon: 'parking', title: 'No Parking Alert', desc: 'Notify owner without calling publicly. No more towing.' },
  { badge: 'SMART', icon: 'tags', title: 'Fastag Issue', desc: 'Resolve fastag related issue like Hotlist & Blacklist' },
  { badge: 'EV FIX', icon: 'charging-station', title: 'E.V', desc: 'E.V Charger Installation.' },
]

// Animated counter hook
const useCounter = (target, duration = 2000) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const startTime = Date.now()
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            setCount(Math.floor(progress * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

const StatCard = ({ target, label, suffix, display }) => {
  const { count, ref } = useCounter(target)
  return (
    <div className="about-stat-card" ref={ref}>
      <h2>{display || `${count}${suffix || ''}`}</h2>
      <p>{label}</p>
    </div>
  )
}

const AboutUs = () => {
  const {
    handleRegisterClick,
    language,
    setLanguage,
    openAuthModal,
    setSupportTicketOpen,
  } = useAppContext()
  const { t } = useTranslation()
  const [letterOpen, setLetterOpen] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="about-page">
      <Helmet>
        <title>About Us - Rakshak | India's Digital Road Shield</title>
        <meta name="description" content="Learn about Rakshak - India's digital road shield. Our mission to protect every vehicle with smart QR technology." />
      </Helmet>

      <Header
        language={language}
        setLanguage={setLanguage}
        onLoginClick={openAuthModal}
        onSupportTicket={() => setSupportTicketOpen(true)}
      />

      {/* Hero */}
      <section className="about-hero-advance">
        <h1 className="about-hero-text">
          {t('aboutHeroText')} <br />
          <span className="highlight">{t('aboutHeroHighlight')}</span>
        </h1>
        <p className="about-hero-sub">{t('aboutHeroSub')}</p>
      </section>

      {/* Stats */}
      <section className="about-stats-section">
        <div className="about-stat-card">
          <h2>{STATS[0].target}+</h2>
          <p>{t('aboutStatVehicles')}</p>
        </div>
        <div className="about-stat-card">
          <h2>{STATS[1].target}+</h2>
          <p>{t('aboutStatAlerts')}</p>
        </div>
        <div className="about-stat-card">
          <h2>{STATS[2].target}+</h2>
          <p>{t('aboutStatSocieties')}</p>
        </div>
        <div className="about-stat-card">
          <h2>24/7</h2>
          <p>{t('aboutStatNetwork')}</p>
        </div>
      </section>

      {/* Info Block 1: Digital Road Shield */}
      <section className="about-info-block">
        <div className="about-info-text">
          <h2>
            {t('aboutDigitalShield')}
          </h2>
          <p>{t('aboutShieldDesc')}</p>
        </div>
        <div className="about-info-visual">
          <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800" alt="Road Safety" />
        </div>
      </section>

      {/* Info Block 2: Kyu Zarurat Hai */}
      <section className="about-info-block reverse dark-bg">
        <div className="about-info-text">
          <h2><span className="highlight">{t('aboutWhyHeadingFull')}</span></h2>
          <p>{t('aboutWhyContent1')}</p>
          <p>
            {t('aboutWhyContent2')} {t('aboutAccidentsDaily')} {t('aboutAccidentsDaily')} {t('aboutDeathsDaily')}
          </p>
          <p>{t('aboutWhyContent3')}</p>
          <p>{t('aboutWhyContent4')}</p>
          <p>{t('aboutWhyContent5')}</p>
          <p>{t('aboutWhyContent6')}</p>
          <a
            href="https://sansad.in/getFile/annex/269/AU1227_uqqpf0.pdf?source=pqars"
            target="_blank"
            rel="noopener noreferrer"
            className="critical-red-link"
          >
            {t('aboutOfficialAccident')}
          </a>
        </div>
        <div className="about-info-visual">
          <img src="https://i.postimg.cc/XNZdpQDV/Chat-GPT-Image-Mar-21-2026-06-43-06-PM.png" alt="Road Safety India" />
        </div>
      </section>

      {/* Info Block 3: Rakshak Help */}
      <section className="about-info-block dark-bg">
        <div className="about-info-text">
          <h2>
            <span className="highlight">{t('aboutHowHeadingFull')}</span>
          </h2>
          <p>{t('aboutHowIntro')}</p>
          <p>
            <strong>1. {t('aboutHowSecurity')}</strong> {t('aboutHowSecurityDesc')}
          </p>
          <p>
            <strong>2. {t('aboutHowRagePrevent')}</strong> {t('aboutHowRagePrevDesc')}
          </p>
          <p>
            <strong>3. {t('aboutHowEmergency')}</strong> {t('aboutHowEmergencyDesc')} {t('aboutHowEmergencyFamily')}
          </p>
        </div>
        <div className="about-info-visual">
          <img
            src="https://i.postimg.cc/X72kqKk7/Whats-App-Image-2026-03-26-at-12-43-02-PM.jpg"
            alt="Rakshak QR Tag"
            style={{ borderRadius: '40px', border: '2px solid #333', boxShadow: '0 10px 30px rgba(242, 140, 56, 0.2)' }}
          />
        </div>
      </section>

      {/* Info Block 4: Vision */}
      <section className="about-info-block reverse dark-bg">
        <div className="about-info-text">
          <h2><span className="highlight">{t('aboutVision')}</span></h2>
          <p>{t('aboutVisionText')}</p>
        </div>
        <div className="about-info-visual">
          <img src="https://i.postimg.cc/jSY5qhGr/Chat-GPT-Image-Mar-21-2026-06-45-36-PM.png" alt="Rakshak Vision" />
        </div>
      </section>

      {/* How It Works */}
      <section className="about-how-section">
        <h2 className="about-section-heading">
          {t('aboutHowWorks')} <span className="highlight">{t('aboutHowWorksHighlight')}</span>
        </h2>
        <p className="about-section-tagline">{t('aboutHowWorksTagline')}</p>
        <div className="about-steps-grid">
          <div className="about-step-card">
            <span className="about-card-badge">SECURE</span>
            <div className="about-card-icon">📱</div>
            <h3>{t('aboutStep1Title')}</h3>
            <p>{t('aboutStep1Desc')}</p>
          </div>
          <div className="about-step-card">
            <span className="about-card-badge">SMART</span>
            <div className="about-card-icon">🔍</div>
            <h3>{t('aboutStep2Title')}</h3>
            <p>{t('aboutStep2Desc')}</p>
          </div>
          <div className="about-step-card">
            <span className="about-card-badge">FAST</span>
            <div className="about-card-icon">🔔</div>
            <h3>{t('aboutStep3Title')}</h3>
            <p>{t('aboutStep3Desc')}</p>
          </div>
          <div className="about-step-card">
            <span className="about-card-badge">HELP</span>
            <div className="about-card-icon">🚑</div>
            <h3>{t('aboutStep4Title')}</h3>
            <p>{t('aboutStep4Desc')}</p>
          </div>
        </div>
      </section>

      {/* Services / Use Cases */}
      <section className="about-services-section">
        <h2 className="about-section-heading">
          {t('aboutServices')} <span className="highlight">{t('aboutServicesHighlight')}</span>
        </h2>
        <p className="about-section-tagline">{t('aboutServicesTagline')}</p>
        <div className="about-usecase-grid">
          <div className="about-case-card">
            <span className="about-card-badge">POLITE</span>
            <div className="about-card-icon">🚑</div>
            <h3>{t('aboutServiceAccident')}</h3>
            <p>{t('aboutServiceAccidentDesc')}</p>
          </div>
          <div className="about-case-card">
            <span className="about-card-badge">POLITE</span>
            <div className="about-card-icon">🅿️</div>
            <h3>{t('aboutServiceParking')}</h3>
            <p>{t('aboutServiceParkingDesc')}</p>
          </div>
          <div className="about-case-card">
            <span className="about-card-badge">SMART</span>
            <div className="about-card-icon">🏷️</div>
            <h3>{t('aboutServiceFastag')}</h3>
            <p>{t('aboutServiceFastagDesc')}</p>
          </div>
          <div className="about-case-card">
            <span className="about-card-badge">EV FIX</span>
            <div className="about-card-icon">🔌</div>
            <h3>{t('aboutServiceEV')}</h3>
            <p>{t('aboutServiceEVDesc')}</p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="about-team-section">
        <h2 className="about-section-heading" style={{ fontSize: '40px' }}>
          {t('aboutMeetGuardians')} <span className="highlight">{t('aboutMeetGuardiansHighlight')}</span>
        </h2>
        <div className="about-team-grid">
          {TEAM_MEMBERS.map((member, i) => (
            <div key={i} className="about-team-card">
              <div className="about-member-img">
                <Image src={member.image} alt={member.name} preview={true} />
              </div>
              <h3 className="about-member-name">{member.name}</h3>
              <p className="about-member-role">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CEO Banner */}
      <section className="about-ceo-section">
        <div className="about-ceo-banner">
          <Image
            src={abhishekImg}
            alt="Abhishek Singh"
            className="about-ceo-img"
            preview={true}
          />
          <div className="about-ceo-overlay">
            <h2>{t('aboutFoundersMessage')}</h2>
            <button className="about-read-letter-btn" onClick={() => setLetterOpen(true)}>
              {t('aboutReadLetter')}
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta-section">
        <h2>{t('aboutCTATitle')}</h2>
        <p>{t('aboutCTASubtitle')}</p>
        <button className="about-activate-btn" onClick={handleRegisterClick}>{t('aboutCTAButton')}</button>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-footer-grid">
          <div className="about-footer-col">
            <h3>{t('aboutFooterProduct')}</h3>
            <Link to="/">{t('aboutFooterRakshakQR')}</Link>
            <Link to="/">{t('aboutFooterEmergencyAlerts')}</Link>
            <Link to="/">{t('aboutFooterNoParkingAlert')}</Link>
          </div>
          <div className="about-footer-col">
            <h3>{t('aboutFooterCompany')}</h3>
            <Link to="/about">{t('aboutFooterAboutUs')}</Link>
            <a href="#vision">{t('aboutFooterVision')}</a>
            <a href="#careers">{t('aboutFooterCareer')}</a>
          </div>
          <div className="about-footer-col">
            <h3>{t('aboutFooterSupport')}</h3>
            <a href="#help">{t('aboutFooterHelpCenter')}</a>
            <a href="#privacy">{t('aboutFooterPrivacy')}</a>
            <Link to="/#contact">{t('aboutFooterContactUs')}</Link>
          </div>
          <div className="about-footer-col">
            <h3>{t('aboutFooterSocial')}</h3>
            <div className="about-social-icons">
              <span>📘</span>
              <span>📷</span>
              <span>💼</span>
            </div>
          </div>
        </div>
        <div className="about-footer-bottom">
          &copy; 2026 {t('footerRights')}
        </div>
      </footer>

      {/* Founder Letter Modal */}
      <Modal
        title={
          <div className="about-letter-header-wrapper">
            <div className="about-letter-modal-img-wrap">
              <Image
                src={abhishekImg}
                alt="Abhishek Singh"
                preview={true}
              />
            </div>
            <div className="about-letter-header-content">
              <h1>{t('aboutLetterTitle')}</h1>
              <p className="about-letter-designation">{t('aboutLetterDesignation')}</p>
            </div>
          </div>
        }
        open={letterOpen}
        onCancel={() => setLetterOpen(false)}
        footer={null}
        width={750}
        centered
        className="about-letter-modal-antd"
      >
        <div className="about-letter-body">
          <hr />
          <p>At Rakshak, our mission is simple yet powerful: to make every vehicle safer and every journey more secure. Rakshak was born from a vision that no vehicle owner should feel helpless during emergencies such as accidents, theft, or unexpected road situations.</p>
          <p>What started as an idea to solve a real-world problem is now evolving into a complete safety ecosystem for vehicle owners. Rakshak aims to connect technology, emergency services, authorities, and families into a single smart platform that protects vehicles and the people who use them.</p>

          <h3>Putting Safety First</h3>
          <p>Every day, millions of people travel on roads, yet many accidents and emergencies go unnoticed or receive delayed help. Rakshak is designed to bridge this gap. Through smart technologies like QR-based vehicle identification, emergency alerts, theft notifications, and instant support systems, we aim to make sure help reaches the right place at the right time.</p>
          <p>Our goal is to create a system where anyone can quickly access critical information about a vehicle during emergencies, helping authorities, families, and support services respond faster and more effectively.</p>

          <h3>Smart Solutions for Everyday Problems</h3>
          <p>Beyond emergencies, Rakshak also focuses on solving daily challenges faced by vehicle owners. One of our key innovations is the No Parking Alert System. Through a simple QR code placed on the vehicle, anyone can notify the owner if the vehicle is blocking a road, gate, or parking area. This eliminates unnecessary conflicts, reduces inconvenience, and creates a smoother parking experience for everyone.</p>
          <p>This simple yet powerful feature ensures that vehicle owners can be contacted instantly without exposing their personal phone numbers, making parking issues easier to resolve.</p>

          <h3>Building a Connected Ecosystem</h3>
          <p>Rakshak is more than just a tool; it is an ecosystem built around vehicle safety and convenience. Our platform integrates features such as Smart Vault for secure vehicle documents, QR management for instant access, emergency response connectivity, theft alerts, and real-time notifications that keep owners and families informed.</p>
          <p>In the future, Rakshak will also collaborate with service providers, parking systems, residential societies, and local authorities to create a connected mobility safety network that benefits everyone on the road.</p>

          <h3>Empowering Communities</h3>
          <p>Safety should not be limited to technology alone. Rakshak aims to empower communities by creating awareness about road safety and responsible mobility. By encouraging better practices and providing easy access to help during emergencies, we hope to make roads safer for drivers, passengers, and pedestrians alike.</p>

          <h3>Looking Ahead</h3>
          <p>Our vision is to build Rakshak into a trusted platform that becomes an essential part of every vehicle owner's life. From accident detection and emergency response to vehicle security, smart documentation, and intelligent parking alerts, Rakshak will continue to evolve to meet the real-world needs of modern mobility.</p>
          <p>This journey is just beginning, but our goal is clear: to build a future where technology protects lives, vehicles, and families.</p>
          <p>To everyone who supports our mission—partners, users, and communities—thank you for believing in Rakshak. Together, we are building a safer road for the future.</p>

          <div className="about-letter-signature">
            <p>With determination and purpose,</p>
            <p className="about-signature-name">Abhishek Singh Raj</p>
            <p>Founder – Rakshak</p>
            <p className="about-signature-tagline">"Har Gaadi Ka Guardian"</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AboutUs
