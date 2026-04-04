import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowLeftOutlined, SendOutlined, MessageOutlined,
  UserOutlined, RobotOutlined, LoadingOutlined,
} from '@ant-design/icons'
import { Tag } from 'antd'
import { db, ref, get, push, onValue } from '../../config/firebase'
<<<<<<< HEAD
import { logAdminAction, ACTIONS } from '../../utils/auditLog'
=======
>>>>>>> main

const SupportInbox = () => {
  const [threads, setThreads] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const chatEndRef = useRef(null)

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const supportSnap = await get(ref(db, 'support'))
        const custSnap = await get(ref(db, 'customers'))
        const customers = custSnap.exists() ? custSnap.val() : {}

        if (supportSnap.exists()) {
          const data = supportSnap.val()
          const threadList = Object.entries(data).map(([key, msgs]) => {
            const msgList = Object.values(msgs).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            const customer = customers[key] || {}
            return {
              customerKey: key,
              name: customer.name || msgList[0]?.name || 'Unknown',
              vehicle: customer.vehicle || msgList[0]?.vehicle || '—',
              lastMessage: msgList[0]?.text || '',
              lastTime: msgList[0]?.timestamp || '',
              messageCount: msgList.length,
            }
          }).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))

          setThreads(threadList)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchThreads()
  }, [])

  useEffect(() => {
    if (!selectedThread) return
    const chatRef = ref(db, `support/${selectedThread.customerKey}`)
    const unsub = onValue(chatRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setMessages(Object.values(data).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)))
      }
    })
    return () => unsub()
  }, [selectedThread])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleReply = async (e) => {
    e.preventDefault()
    if (!reply.trim() || !selectedThread) return
    setSending(true)
    try {
      await push(ref(db, `support/${selectedThread.customerKey}`), {
        text: reply.trim(),
        sender: 'admin',
        timestamp: new Date().toISOString(),
      })
      setReply('')
<<<<<<< HEAD
      await logAdminAction(ACTIONS.SUPPORT_REPLY, selectedThread.customerKey, selectedThread.name, { message: reply.trim().slice(0, 100) })
=======
>>>>>>> main
      toast.success('Reply sent')
    } catch {
      toast.error('Failed to send')
    } finally {
      setSending(false)
    }
  }

  const QUICK_REPLIES = [
    'Looking into it. Will update shortly.',
    'Issue resolved. Please check now.',
    'Share your Rakshak ID for faster help.',
    'QR dispatched within 24 hours.',
    'Refund initiated. Allow 5-7 days.',
  ]

  if (loading) return <div className="adm-loading"><LoadingOutlined /> Loading support...</div>

  return (
    <div className="adm-support-mobile">
      {/* Thread List View */}
      {!selectedThread ? (
        <div className="adm-support-threads">
          <p className="adm-result-count" style={{ marginBottom: 12 }}>{threads.length} conversations</p>
          {threads.map((t) => (
            <div
              key={t.customerKey}
              className="adm-card adm-card-tap"
              onClick={() => setSelectedThread(t)}
            >
              <div className="adm-card-row adm-card-row-between">
                <span className="adm-card-name"><MessageOutlined /> {t.name}</span>
                <span className="adm-card-meta-text">
                  {t.lastTime ? new Date(t.lastTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                </span>
              </div>
              <div className="adm-card-row">
                <span className="adm-card-vehicle">{t.vehicle}</span>
              </div>
              <div className="adm-card-row">
                <span className="adm-support-preview">{t.lastMessage.slice(0, 60)}{t.lastMessage.length > 60 ? '...' : ''}</span>
              </div>
              <div className="adm-card-row adm-card-meta">
                <span>{t.messageCount} messages</span>
              </div>
            </div>
          ))}
          {threads.length === 0 && <p className="adm-empty">No support threads yet</p>}
        </div>
      ) : (
        /* Chat View */
        <div className="adm-chat-full">
          <div className="adm-chat-topbar">
            <button className="adm-back-btn" onClick={() => setSelectedThread(null)}><ArrowLeftOutlined /> Back</button>
            <div className="adm-chat-topbar-info">
              <span className="adm-chat-topbar-name">{selectedThread.name}</span>
              <span className="adm-chat-topbar-vehicle">{selectedThread.vehicle}</span>
            </div>
          </div>

          <div className="adm-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`adm-chat-msg ${msg.sender === 'admin' ? 'adm-msg-admin' : msg.sender === 'bot' ? 'adm-msg-bot' : 'adm-msg-user'}`}>
                <div className="adm-msg-bubble">
                  <p>{msg.text}</p>
                  <span className="adm-msg-meta">
                    {msg.sender === 'admin' ? <><UserOutlined /> Admin</> : msg.sender === 'bot' ? <><RobotOutlined /> Bot</> : <><UserOutlined /> User</>} · {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="adm-quick-replies">
            {QUICK_REPLIES.map((qr, i) => (
              <button key={i} className="adm-qr-btn" onClick={() => setReply(qr)}>{qr}</button>
            ))}
          </div>

          <form className="adm-chat-input" onSubmit={handleReply}>
            <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type reply..." disabled={sending} />
            <button type="submit" disabled={!reply.trim() || sending}><SendOutlined /></button>
          </form>
        </div>
      )}
    </div>
  )
}

export default SupportInbox
