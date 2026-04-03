import { GOVT_REPORTS } from '../../utils/constants'
import useTranslation from '../../i18n/useTranslation'
import './WhyIndia.css'

const NEEDS_KEYS = [
  { id: 1, badge: 'ALARMING', titleKey: 'whyIndia1Title', descKey: 'whyIndia1Desc', isAlert: true },
  { id: 2, badge: 'ROAD RAGE', titleKey: 'whyIndia2Title', descKey: 'whyIndia2Desc' },
  { id: 3, badge: 'CHALLAN', titleKey: 'whyIndia3Title', descKey: 'whyIndia3Desc' },
]

const WhyIndia = ({ onCardClick }) => {
  const { t } = useTranslation()

  return (
    <section className="why-india-section" id="about">
      <div className="section-container">
        <h2 className="section-title">
          {t('whyIndiaTitle')} <span className="highlight">{t('whyIndiaTitleHighlight')}</span>
        </h2>
        <p className="section-subtitle">{t('whyIndiaSubtitle')}</p>

        <div className="needs-grid">
          {NEEDS_KEYS.map((item, index) => (
            <div
              key={item.id}
              className={`needs-card ${item.isAlert ? 'alert-card' : ''}`}
              onClick={() => onCardClick && onCardClick(index, 'needs')}
            >
              <span className={`needs-badge ${item.isAlert ? 'badge-alert' : ''}`}>{item.badge}</span>
              <h4 className={item.isAlert ? 'alert-title' : ''}>{t(item.titleKey)}</h4>
              <p className="needs-desc">{t(item.descKey)}</p>
            </div>
          ))}
        </div>

        <div className="report-link-box">
          <p className="report-heading">📊 VERIFIED GOVT. REPORTS (2024-25):</p>
          <ul className="report-list">
            {GOVT_REPORTS.map((report, i) => (
              <li key={i}>
                <a href={report.url} target="_blank" rel="noopener noreferrer">{report.label}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="about-box">
          <div className="about-content">
            <h3>{t('whyIndiaAboutTitle')}</h3>
            <p>{t('whyIndiaAboutDesc')}</p>
            <p className="about-quote">{t('whyIndiaAboutQuote')}</p>
            <div className="about-stats">
              <div className="stat-item">
                <span className="stat-num">2,400+</span>
                <span className="stat-label">Saved Families</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">100%</span>
                <span className="stat-label">Privacy Shield</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">24/7</span>
                <span className="stat-label">Emergency Active</span>
              </div>
            </div>
          </div>
          <div className="about-shield">🛡️</div>
        </div>
      </div>
    </section>
  )
}

export default WhyIndia
