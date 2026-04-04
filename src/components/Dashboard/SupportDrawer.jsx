import { useState, useRef, useEffect } from 'react'
import { db, ref, push, onValue } from '../../config/firebase'
import { useAppContext } from '../../context/AppContext'
import './SupportDrawer.css'

const QUICK_ACTIONS = [
  { id: 'order', label: 'Where is my order?', icon: '📦' },
  { id: 'qr', label: 'QR not working', icon: '🔲' },
  { id: 'number', label: 'Change my number', icon: '📱' },
  { id: 'refund', label: 'Payment / Refund issue', icon: '💳' },
  { id: 'plan', label: 'Upgrade my plan', icon: '⭐' },
]

const SupportDrawer = ({ open, onClose }) => {
  const { currentUser } = useAppContext()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef(null)

  // Load chat history
  useEffect(() => {
    if (!open || !currentUser?.key) return

    const chatRef = ref(db, `support/${currentUser.key}`)
    const unsub = onValue(chatRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        const list = Object.values(data).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        setMessages(list)
      }
    })

    return () => unsub()
  }, [open, currentUser?.key])

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim() || !currentUser?.key) return
    setSending(true)

    try {
      const chatRef = ref(db, `support/${currentUser.key}`)
      await push(chatRef, {
        text: text.trim(),
        sender: 'user',
        name: currentUser.name,
        vehicle: currentUser.vehicle,
        timestamp: new Date().toISOString(),
      })

      // Auto-reply after a short delay
      setTimeout(async () => {
        await push(chatRef, {
          text: 'Thanks for reaching out! Our support team will get back to you within 24 hours. For urgent issues, please call us directly.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
        })
      }, 1200)

      setInput('')
    } catch (err) {
      console.error('Send error:', err)
    } finally {
      setSending(false)
    }
  }

  const handleQuickAction = (action) => {
    sendMessage(action.label)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  if (!open) return null

  return (
    <div className="sd-overlay" onClick={onClose}>
      <div className="sd-drawer" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="sd-header">
          <div className="sd-header-left">
            <div className="sd-avatar">🛡️</div>
            <div>
              <h3>Rakshak Support</h3>
              <span className="sd-status">
                <span className="sd-online-dot" /> Usually replies instantly
              </span>
            </div>
          </div>
          <button className="sd-close" onClick={onClose}>✕</button>
        </div>

        {/* Contact Bar */}
        <div className="sd-contact-bar">
          <a href="tel:+918700730344" className="sd-contact-btn sd-call">
            <span>📞</span> Call Now
          </a>
          <a href="https://api.whatsapp.com/send?phone=918700730344&text=Hi%20Rakshak%20Support" className="sd-contact-btn sd-wa" target="_blank" rel="noopener noreferrer">
            <span>💬</span> WhatsApp
          </a>
          <a href="mailto:support@rakshak.com" className="sd-contact-btn sd-email">
            <span>📧</span> Email
          </a>
        </div>

        {/* Chat Area */}
        <div className="sd-chat">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="sd-welcome">
              <div className="sd-welcome-icon">👋</div>
              <h4>Hi {currentUser?.name?.split(' ')[0] || 'there'}!</h4>
              <p>How can we help you today?</p>
            </div>
          )}

          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="sd-quick-actions">
              {QUICK_ACTIONS.map((action) => (
                <button key={action.id} className="sd-quick-btn" onClick={() => handleQuickAction(action)}>
                  <span>{action.icon}</span> {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`sd-msg ${msg.sender === 'user' ? 'sd-msg-user' : 'sd-msg-bot'}`}>
              <div className="sd-msg-bubble">
                <p>{msg.text}</p>
                <span className="sd-msg-time">
                  {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form className="sd-input-bar" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button type="submit" disabled={!input.trim() || sending} className="sd-send-btn">
            {sending ? '...' : '➤'}
          </button>
        </form>

      </div>
    </div>
  )
}

export default SupportDrawer
