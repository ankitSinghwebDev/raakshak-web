import { SERVICES } from '../../utils/constants'
import useTranslation from '../../i18n/useTranslation'
import './Services.css'

const Services = ({ onServiceClick }) => {
  const { t } = useTranslation()

  return (
    <section className="services-section" id="services">
      <div className="section-container">
        <h2 className="section-title section-title-lg">
          {t('servicesTitle')} <span className="highlight">{t('servicesTitleHighlight')}</span>
        </h2>
        <p className="section-subtitle">{t('servicesSubtitle')}</p>

        <div className="services-grid">
          {SERVICES.map((service) => (
            <div key={service.id} className="service-card" onClick={() => onServiceClick && onServiceClick(service.id)}>
              <span className="service-badge">{service.badge}</span>
              <div className="service-icon" aria-hidden="true">{service.icon}</div>
              <h3 className="service-title">{service.name}</h3>
              <p className="service-desc">{service.description}</p>
              <button className="btn-service">{service.buttonText}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Services
