import useTranslation from '../../i18n/useTranslation'
import './Footer.css'

const Footer = ({ onAdminLogin }) => {
  const currentYear = new Date().getFullYear()
  const { t } = useTranslation()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <p className="footer-text">
            &copy; {currentYear} {t('footerRights')}
            <span onClick={onAdminLogin} style={{ cursor: 'pointer', opacity: 0.05, marginLeft: '4px' }}>.</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
