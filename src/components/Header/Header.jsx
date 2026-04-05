import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MenuOutlined, CloseOutlined } from '@ant-design/icons'
import useBodyLock from '../../hooks/useBodyLock'
import useTranslation from '../../i18n/useTranslation'
import logoImg from '../../assets/icons/Rakshak.jpg'
import './Header.css'

const Header = ({ language, setLanguage, onLoginClick, onSupportTicket }) => {
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
          <Link to="/#features">{t('navWhyRakshak')}</Link>
          <Link to="/#premium-tools">{t('navPremiumTools')}</Link>
          <Link to="/#services">{t('navServices')}</Link>
          <Link to="/about">{t('navAboutUs')}</Link>
          <Link to="/#contact">{t('navContact')}</Link>
        </nav>

        <div className="nav-right">
          <button className="btn-login" onClick={() => onLoginClick('user')}>{t('navLoginPortal')}</button>
          <select className="language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">ENGLISH</option>
            <option value="hi">हिन्दी</option>
          </select>
          <div className="partner-dropdown" onMouseEnter={() => setPartnerDropdownOpen(true)} onMouseLeave={() => setPartnerDropdownOpen(false)}>
            <button className="partner-zone-btn">{t('navPartnerZone')}</button>
            {partnerDropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={() => onLoginClick('partner')}>{t('navPartnerLogin')}</button>
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
            <Link to="/#features" onClick={handleNavClick}>{t('navWhyRakshak')}</Link>
            <Link to="/#premium-tools" onClick={handleNavClick}>{t('navPremiumTools')}</Link>
            <Link to="/#services" onClick={handleNavClick}>{t('navServices')}</Link>
            <Link to="/about" onClick={handleNavClick}>{t('navAboutUs')}</Link>
            <Link to="/#contact" onClick={handleNavClick}>{t('navContact')}</Link>
            <div className="mobile-divider" />
            <button className="mobile-link highlight-link" onClick={() => { closeMenu(); onLoginClick('user') }}>{t('navLoginPortal')}</button>
            <button className="mobile-link" onClick={() => { closeMenu(); onLoginClick('partner') }}>{t('navPartnerLogin')}</button>
            <button className="mobile-link" onClick={() => { closeMenu(); onSupportTicket() }}>{t('navSupportTicket')}</button>
            <button className="mobile-link" onClick={() => { closeMenu(); onLoginClick('admin') }}>{t('navAdminLogin')}</button>
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
