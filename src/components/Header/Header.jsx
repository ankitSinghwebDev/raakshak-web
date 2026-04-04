import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MenuOutlined, CloseOutlined } from '@ant-design/icons'
import useBodyLock from '../../hooks/useBodyLock'
import useTranslation from '../../i18n/useTranslation'
import logoImg from '../../assets/icons/Rakshak.jpg'
import './Header.css'

const Header = ({ language, setLanguage, onLoginClick, onPartnerLogin, onSupportTicket, onAdminLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useBodyLock(mobileMenuOpen)
  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false)
  const { t } = useTranslation()

  const closeMenu = useCallback(() => setMobileMenuOpen(false), [])
  const handleNavClick = useCallback(() => closeMenu(), [closeMenu])

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo-wrap" onClick={closeMenu}>
          <img src={logoImg} alt="Rakshak" className="logo-img" />
          <span className="logo-text">RAKSHAK</span>
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
        </button>

        <nav className="nav-desktop">
          <a href="#features">{t('navWhyRakshak')}</a>
          <a href="#premium-tools">{t('navPremiumTools')}</a>
          <a href="#services">{t('navServices')}</a>
          <Link to="/about">{t('navAboutUs')}</Link>
          <a href="#contact">{t('navContact')}</a>
        </nav>

        <div className="nav-right">
          <button className="btn-login" onClick={onLoginClick}>{t('navAlreadyRegistered')}</button>
          <button className="btn-admin-login" onClick={onAdminLogin}>ADMIN</button>
          <select className="language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">ENGLISH</option>
            <option value="hi">हिन्दी</option>
          </select>
          <div className="partner-dropdown" onMouseEnter={() => setPartnerDropdownOpen(true)} onMouseLeave={() => setPartnerDropdownOpen(false)}>
            <button className="partner-zone-btn">{t('navPartnerZone')}</button>
            {partnerDropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={onPartnerLogin}>{t('navPartnerLogin')}</button>
                <button onClick={onSupportTicket}>{t('navSupportTicket')}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <div className="mobile-overlay" onClick={closeMenu} />
          <nav className="mobile-menu">
            <div className="mobile-menu-header">
              <img src={logoImg} alt="Rakshak" className="mobile-menu-logo" />
              <span className="mobile-menu-brand">RAKSHAK</span>
            </div>
            <a href="#features" onClick={handleNavClick}>{t('navWhyRakshak')}</a>
            <a href="#premium-tools" onClick={handleNavClick}>{t('navPremiumTools')}</a>
            <a href="#services" onClick={handleNavClick}>{t('navServices')}</a>
            <Link to="/about" onClick={handleNavClick}>{t('navAboutUs')}</Link>
            <a href="#contact" onClick={handleNavClick}>{t('navContact')}</a>
            <div className="mobile-divider" />
            <button className="mobile-link highlight-link" onClick={() => { closeMenu(); onLoginClick() }}>{t('navAlreadyRegistered')}</button>
            <button className="mobile-link" onClick={() => { closeMenu(); onPartnerLogin() }}>{t('navPartnerLogin')}</button>
            <button className="mobile-link" onClick={() => { closeMenu(); onSupportTicket() }}>{t('navSupportTicket')}</button>
            <button className="mobile-link" onClick={() => { closeMenu(); onAdminLogin() }}>{t('navAdminLogin')}</button>
            <div className="mobile-divider" />
            <select className="mobile-lang-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">🌐 ENGLISH</option>
              <option value="hi">🌐 हिन्दी</option>
            </select>
          </nav>
        </>
      )}
    </header>
  )
}

export default Header
