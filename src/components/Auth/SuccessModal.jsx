import useTranslation from '../../i18n/useTranslation'
import './SuccessModal.css'

const SuccessModal = ({ open, onClose, data }) => {
  const { t } = useTranslation()
  if (!open || !data) return null

  const { generatedId, vehicleNum, qrUrl } = data

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="success-modal-content glass-effect" onClick={(e) => e.stopPropagation()}>
        <h2 className="success-title">{t('successTitle')}</h2>

        <div className="final-sticker-preview">
          <div className="sticker-top">
            <div className="sticker-logo">
              <img src="https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png" alt="Rakshak Logo" />
            </div>
            <div className="sticker-title">
              <h3>SCAN TO<br />INFORM OWNER</h3>
            </div>
            <div className="sticker-qr">
              <img src={qrUrl} alt="QR Code" />
            </div>
          </div>
          <div className="sticker-bottom">
            <div className="vnum-display">{vehicleNum}</div>
          </div>
        </div>

        <div className="user-id-box">
          <p className="user-id-label">{t('successYourId')}</p>
          <h2 className="user-id-value">{generatedId}</h2>
        </div>

        <p className="success-msg">{t('successQRLinked')}</p>

        <button className="btn-done" onClick={onClose}>{t('successDone')}</button>
      </div>
    </div>
  )
}

export default SuccessModal
