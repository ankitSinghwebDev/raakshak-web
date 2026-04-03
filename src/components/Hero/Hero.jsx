import React from 'react'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import useTranslation from '../../i18n/useTranslation'
import coverImg from '../../assets/icons/coverpage.jpg'
import './Hero.css'

const Hero = ({ onRegisterClick }) => {
  const { t } = useTranslation()

  return (
    <section className="hero">
      <div className="hero-bg">
        <img src={coverImg} alt="" className="hero-bg-img" />
        <div className="hero-overlay" />
      </div>
      <div className="hero-content">
        <div className="hero-counter">
          <span className="blinking-dot" aria-hidden="true"></span> {t('heroCounter')}
        </div>
        <h1 className="hero-title">{t('heroTitle')}</h1>
        <p className="hero-tagline">{t('heroTagline')}</p>
        <button className="btn-register" onClick={onRegisterClick}>
          <SafetyCertificateOutlined /> {t('heroCTA')}
        </button>
      </div>
    </section>
  )
}

export default Hero
