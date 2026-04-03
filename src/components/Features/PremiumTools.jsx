import { PREMIUM_TOOLS } from '../../utils/constants'
import useTranslation from '../../i18n/useTranslation'
import './PremiumTools.css'

const PremiumTools = ({ onLoginClick }) => {
  const { t } = useTranslation()

  return (
    <section className="premium-tools-section" id="premium-tools">
      <div className="section-container">
        <h2 className="section-title section-title-lg">
          {t('premiumToolsTitle')} <span className="highlight">{t('premiumToolsTitleHighlight')}</span>
        </h2>
        <p className="section-subtitle">{t('premiumToolsSubtitle')}</p>

        <div className="tools-grid">
          {PREMIUM_TOOLS.map((tool) => (
            <div key={tool.id} className={`tool-card ${tool.status}`} onClick={() => onLoginClick && onLoginClick()} style={{ cursor: 'pointer' }}>
              <span className="tool-badge">{tool.badge}</span>
              <div className="tool-icon">{tool.icon}</div>
              <h3 className="tool-title">{tool.name}</h3>
              <p className="tool-desc">{tool.description}</p>
              <button className={`btn-tool ${tool.status}`}>{tool.buttonText}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PremiumTools
