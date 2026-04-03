import { PhoneOutlined, MessageOutlined } from '@ant-design/icons'
import { CONTACT_INFO } from '../../utils/constants'
import useTranslation from '../../i18n/useTranslation'
import './Contact.css'

const Contact = () => {
  const { t } = useTranslation()

  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <h2 className="section-title">{t('contactTitle')}</h2>
        <div className="contact-info">
          <div className="contact-details">
            <p className="contact-line"><span className="contact-label">Email:</span> {CONTACT_INFO.email}</p>
            <p className="contact-line"><span className="contact-label">Phone:</span> {CONTACT_INFO.phone}</p>
            <p className="contact-line"><span className="contact-label">Office:</span> {CONTACT_INFO.office}</p>
          </div>
          <div className="contact-buttons">
            <a href={`tel:${CONTACT_INFO.phone}`} className="btn-contact">
              <PhoneOutlined /> {t('contactCallNow')}
            </a>
            <a href={`https://wa.me/${CONTACT_INFO.whatsapp}`} className="btn-contact btn-whatsapp" target="_blank" rel="noopener noreferrer">
              <MessageOutlined /> {t('contactWhatsApp')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
