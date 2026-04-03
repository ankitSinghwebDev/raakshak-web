import React, { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import './LoginModal.css'

const SupportTicketModal = ({ open, onClose }) => {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const handleClose = useCallback(() => {
    setSubject('')
    setMessage('')
    onClose()
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Send support ticket to Firebase or email
    toast.success('Ticket submitted! We will get back to you soon.')
    handleClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="support-modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={handleClose}>&times;</span>
        <div className="support-icon">📧</div>
        <h2 className="support-title">SUPPORT & TICKET</h2>
        <p className="support-subtitle">WE ARE HERE TO HELP YOU</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="SUBJECT"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="support-input"
          />
          <textarea
            placeholder="MESSAGE"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="support-textarea"
          />
          <button type="submit" className="btn-modal-submit" style={{ background: '#F28C38' }}>
            SEND TICKET ➔
          </button>
        </form>
      </div>
    </div>
  )
}

export default SupportTicketModal
