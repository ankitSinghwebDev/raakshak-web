import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAppContext } from '../../context/AppContext'
import Header from '../Header/Header'
import './AboutUs.css'

const TEAM_MEMBERS = [
  {
    name: 'Abhishek Singh',
    role: 'Founder & CEO',
    image: 'https://i.postimg.cc/9M3DCQpQ/Whats-App-Image-2026-03-21-at-12-59-57-AM.jpg',
  },
  {
    name: 'Gaurav Kumar',
    role: 'Co-Founder & Head of Ops',
    image: 'https://i.postimg.cc/HkpxSMhp/Whats-App-Image-2026-03-20-at-10-34-06-AM.jpg',
  },
  {
    name: 'Ashish Dubey',
    role: 'Co-Founder & Strategy',
    image: 'https://via.placeholder.com/150',
  },
  {
    name: 'Yash Upadhyay',
    role: 'Co-Founder & Finance',
    image: 'https://i.postimg.cc/gkGmdWq1/Whats-App-Image-2026-03-19-at-9-38-59-PM.jpg',
  },
  {
    name: 'Hars Kumar',
    role: 'Head of Partnerships',
    image: 'https://i.postimg.cc/YCbNrYGd/Screenshot-2026-03-21-005739.png',
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
          India's Future of <br />
          <span className="highlight">Safety Starts Here</span>
        </h1>
        <p className="about-hero-sub">EVERY SECOND MATTERS IN EMERGENCY</p>
      </section>

      {/* Stats */}
      <section className="about-stats-section">
        {STATS.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </section>

      {/* Info Block 1: Digital Road Shield */}
      <section className="about-info-block">
        <div className="about-info-text">
          <h2>
            RAKSHAK: India's Digital <br />
            <span className="highlight">Road Shield</span>
          </h2>
          <p>
            Rakshak is not just a simple sticker or a QR code. It is a digital safety ecosystem designed to provide smart solutions for modern vehicle owners. On today's busy roads, situations like wrong parking, emergencies, or the need to quickly contact a vehicle owner are very common, yet there is often no safe or convenient way to reach them. Many people end up writing their personal phone numbers on their cars, which creates serious privacy risks and can lead to misuse. Rakshak solves this problem by creating a secure and smart communication bridge, allowing people to connect with vehicle owners when necessary while protecting their personal information.
          </p>
        </div>
        <div className="about-info-visual">
          <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800" alt="Road Safety" />
        </div>
      </section>

      {/* Info Block 2: Kyu Zarurat Hai */}
      <section className="about-info-block reverse dark-bg">
        <div className="about-info-text">
          <h2>Kyu Zarurat Hai <span className="highlight">Rakshak</span> Ki?</h2>
          <p>
            India has one of the largest road networks in the world, but it also faces serious road safety challenges. Every single day, thousands of incidents happen on Indian roads — from accidents and road rage to parking conflicts and emergency situations where people struggle to contact the vehicle owner.
          </p>
          <p>
            According to recent government road safety reports, India records over <span className="danger-red">4,80,000</span> road accidents every year, resulting in more than <span className="danger-red">1,72,000</span> deaths and over <span className="danger-red">4,60,000</span> injuries. This means that around <span className="danger-red">1,300</span> road accidents and nearly <span className="danger-red">470</span> people lose their lives on Indian roads every single day. In simple terms, one life is lost almost every three minutes on our roads.
          </p>
          <p>
            Apart from accidents, daily road problems like wrong parking and blocked vehicles create frustration for millions of people across cities and towns. In crowded markets, residential areas, and narrow streets, vehicles are often parked in places where they block others. When this happens, people usually have no safe or proper way to contact the vehicle owner.
          </p>
          <p>
            This often leads to arguments, road rage situations, unnecessary delays, and stressful confrontations between strangers. What could have been solved with a simple communication becomes a bigger problem because there is no secure and quick way to reach the vehicle owner.
          </p>
          <p>
            To avoid this problem, many vehicle owners write their personal phone numbers on their cars or bikes. While this may help in some situations, it also creates a major privacy risk. Personal numbers become visible to anyone on the road, which can lead to spam calls, harassment, or misuse of personal information.
          </p>
          <p>
            In a country like India where roads are busy, parking spaces are limited, and unexpected situations happen every day, there is a clear need for a smart, safe, and privacy-focused solution.
          </p>
          <a
            href="https://sansad.in/getFile/annex/269/AU1227_uqqpf0.pdf?source=pqars"
            target="_blank"
            rel="noopener noreferrer"
            className="critical-red-link"
          >
            CLICK HERE FOR OFFICIAL ACCIDENT INFORMATION
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
            Rakshak Aapki <span className="highlight">Help Kaise Karta Hai?</span>
          </h2>
          <p>
            Rakshak sirf ek sticker nahi, ek smart digital ecosystem hai jo aapki privacy aur safety ka dhyan rakhta hai. Jab bhi aapki gaadi kisi mushkil mein hoti hai, Rakshak teen tarikon se aapki madad karta hai:
          </p>
          <p>
            <strong>1. Secure Communication:</strong> Rakshak allows people to contact you without exposing your personal phone number.
            Anyone can simply scan the Rakshak QR and send you an anonymous alert or call request through the system. Your number remains completely private, protecting you from spam calls, harassment, and stalking risks while still allowing important communication when needed.
          </p>
          <p>
            <strong>2. Road Rage Prevention:</strong> Parking conflicts and blocked vehicles often lead to unnecessary arguments and road rage. Rakshak helps prevent these situations by enabling people to send a polite digital alert to the vehicle owner through a simple QR scan. Instead of shouting or damaging vehicles, they can notify the owner calmly, helping resolve the situation quickly and peacefully.
          </p>
          <p>
            <strong>3. Emergency Connectivity:</strong> In an accident or medical emergency, every second matters. When someone scans your Rakshak QR, they can instantly access critical information such as emergency alerts and essential medical details like your blood group. This helps bystanders or responders understand the situation quickly and provide the right help without wasting valuable time. With Rakshak, your family members remain in full control of sensitive information. Once your family approves access during an emergency, important medical details such as your medical history or existing health conditions can be securely shared with the person who scanned the QR. This allows them to inform doctors or medical staff about your condition, helping them make faster and safer treatment decisions. At the same time, your family's personal contact numbers are never directly visible to the person scanning the QR. Instead, Rakshak uses a secure masked calling system that allows the bystander to connect with your family instantly without revealing their private phone numbers. This ensures both privacy and quick emergency communication when it matters the most.
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
          <h2>Humara <span className="highlight">Vision</span></h2>
          <p>
            Humara Vision hai ki har Indian parivaar raat ko chain se soye, ye jaante huye ki unke log aur unki gaadi hamesha mehfooz hain. 🛡️
          </p>
        </div>
        <div className="about-info-visual">
          <img src="https://i.postimg.cc/jSY5qhGr/Chat-GPT-Image-Mar-21-2026-06-45-36-PM.png" alt="Rakshak Vision" />
        </div>
      </section>

      {/* How It Works */}
      <section className="about-how-section">
        <h2 className="about-section-heading">
          How <span className="highlight">It Works</span>
        </h2>
        <p className="about-section-tagline">Easy Process for Faster Help in Emergencies</p>
        <div className="about-steps-grid">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="about-step-card">
              <span className="about-card-badge">{step.badge}</span>
              <div className="about-card-icon">
                {step.icon === 'qrcode' && '📱'}
                {step.icon === 'expand-arrows-alt' && '🔍'}
                {step.icon === 'bell' && '🔔'}
                {step.icon === 'shipping-fast' && '🚑'}
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services / Use Cases */}
      <section className="about-services-section">
        <h2 className="about-section-heading">
          Rakshak <span className="highlight">Services</span>
        </h2>
        <p className="about-section-tagline">Smart Safety Solutions for Every Vehicle</p>
        <div className="about-usecase-grid">
          {USE_CASES.map((uc, i) => (
            <div key={i} className="about-case-card">
              <span className="about-card-badge">{uc.badge}</span>
              <div className="about-card-icon">
                {uc.icon === 'ambulance' && '🚑'}
                {uc.icon === 'parking' && '🅿️'}
                {uc.icon === 'tags' && '🏷️'}
                {uc.icon === 'charging-station' && '🔌'}
              </div>
              <h3>{uc.title}</h3>
              <p>{uc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="about-team-section">
        <h2 className="about-section-heading" style={{ fontSize: '40px' }}>
          Meet The <span className="highlight">Guardians</span>
        </h2>
        <div className="about-team-grid">
          {TEAM_MEMBERS.map((member, i) => (
            <div key={i} className="about-team-card">
              <div className="about-member-img">
                <img src={member.image} alt={member.name} />
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
          <img
            src="https://i.postimg.cc/9M3DCQpQ/Whats-App-Image-2026-03-21-at-12-59-57-AM.jpg"
            alt="Abhishek Singh"
            className="about-ceo-img"
          />
          <div className="about-ceo-overlay">
            <h2>A Message From Our Founder</h2>
            <button className="about-read-letter-btn" onClick={() => setLetterOpen(true)}>
              Read Abhishek's Full Letter
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta-section">
        <h2>Ready to Protect Your Vehicle?</h2>
        <p>Activate Rakshak today and make every journey safer.</p>
        <button className="about-activate-btn" onClick={handleRegisterClick}>Activate Rakshak</button>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="about-footer-grid">
          <div className="about-footer-col">
            <h3>Product</h3>
            <Link to="/">Rakshak QR</Link>
            <Link to="/">Emergency Alerts</Link>
            <Link to="/">No Parking Alert</Link>
          </div>
          <div className="about-footer-col">
            <h3>Company</h3>
            <Link to="/about">About Us</Link>
            <a href="#vision">Vision</a>
            <a href="#careers">Careers</a>
          </div>
          <div className="about-footer-col">
            <h3>Support</h3>
            <a href="#help">Help Center</a>
            <a href="#privacy">Privacy Policy</a>
            <Link to="/#contact">Contact</Link>
          </div>
          <div className="about-footer-col">
            <h3>Social</h3>
            <div className="about-social-icons">
              <span>📘</span>
              <span>📷</span>
              <span>💼</span>
            </div>
          </div>
        </div>
        <div className="about-footer-bottom">
          &copy; 2026 Rakshak Technology India Private Limited. All Rights Reserved.
        </div>
      </footer>

      {/* Founder Letter Modal */}
      {letterOpen && (
        <div className="modal-overlay" onClick={() => setLetterOpen(false)}>
          <div className="about-letter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="about-letter-header">
              <button className="about-letter-close" onClick={() => setLetterOpen(false)}>CLOSE ✖</button>
              <img
                src="https://i.postimg.cc/9M3DCQpQ/Whats-App-Image-2026-03-21-at-12-59-57-AM.jpg"
                alt="Abhishek Singh"
                className="about-letter-img"
              />
            </div>
            <div className="about-letter-body">
              <h1>Message from Abhishek Singh Raj</h1>
              <p className="about-letter-designation">Founder – Rakshak</p>
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
          </div>
        </div>
      )}
    </div>
  )
}

export default AboutUs
