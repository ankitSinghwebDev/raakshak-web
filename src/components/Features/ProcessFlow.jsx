import useTranslation from '../../i18n/useTranslation'
import './ProcessFlow.css'

const STEP_KEYS = [
  { icon: '📝', titleKey: 'processStep1', descKey: 'processStep1Desc' },
  { icon: '💳', titleKey: 'processStep2', descKey: 'processStep2Desc' },
  { icon: '✨', titleKey: 'processStep3', descKey: 'processStep3Desc' },
  { icon: '📦', titleKey: 'processStep4', descKey: 'processStep4Desc' },
  { icon: '🛡️', titleKey: 'processStep5', descKey: 'processStep5Desc' },
]

const ProcessFlow = () => {
  const { t } = useTranslation()

  return (
    <section className="process-section" id="process-flow">
      <div className="section-container">
        <h2 className="section-title">
          {t('processTitle')} <span className="highlight">{t('processTitleHighlight')}</span> Flow
        </h2>
        <p className="section-subtitle">{t('processSubtitle')}</p>

        <div className="process-wrapper">
          <div className="process-line"></div>
          <div className="process-grid">
            {STEP_KEYS.map((step, index) => (
              <div key={index} className="process-item">
                <div className="process-circle">{step.icon}</div>
                <h4>{t(step.titleKey)}</h4>
                <p>{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProcessFlow
