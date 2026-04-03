import useTranslation from '../../i18n/useTranslation'
import './Features.css'

const FEATURE_KEYS = [
  { badge: 'Polite', icon: '🚗', titleKey: 'feature1Title', descKey: 'feature1Desc' },
  { badge: '100% Secure', icon: '🔐', titleKey: 'feature2Title', descKey: 'feature2Desc' },
  { badge: 'Life Saving', icon: '📞', titleKey: 'feature3Title', descKey: 'feature3Desc' },
  { badge: 'Dashboard', icon: '⚙️', titleKey: 'feature4Title', descKey: 'feature4Desc' },
  { badge: 'Fast Scan', icon: '📱', titleKey: 'feature5Title', descKey: 'feature5Desc' },
  { badge: 'Universal', icon: '🚚', titleKey: 'feature6Title', descKey: 'feature6Desc' },
  { badge: 'Radium', icon: '🛡️', titleKey: 'feature7Title', descKey: 'feature7Desc' },
  { badge: 'Desi Fix', icon: '🇮🇳', titleKey: 'feature8Title', descKey: 'feature8Desc' },
]

const Features = ({ onCardClick }) => {
  const { t } = useTranslation()

  return (
    <section className="features-section" id="features">
      <div className="section-container">
        <h2 className="section-title">
          {t('featuresTitle')} <span className="highlight">{t('featuresTitleHighlight')}</span>
        </h2>
        <p className="section-subtitle">{t('featuresSubtitle')}</p>

        <div className="features-grid">
          {FEATURE_KEYS.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              onClick={() => onCardClick && onCardClick(index, 'love')}
              style={{ cursor: 'pointer' }}
            >
              <span className="feature-badge">{feature.badge}</span>
              <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
              <h3 className="feature-title">{t(feature.titleKey)}</h3>
              <p className="feature-desc">{t(feature.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
