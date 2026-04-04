import { useState, useEffect } from 'react'
import { db, ref, get, query, orderByChild, equalTo } from '../../config/firebase'
import { useAppContext } from '../../context/AppContext'
import './MyVehiclesModal.css'

const MyVehiclesModal = ({ open, onClose }) => {
  const { currentUser, loginUser } = useAppContext()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !currentUser?.mobile) return

    const fetchVehicles = async () => {
      setLoading(true)
      try {
        const customersRef = ref(db, 'customers')
        let results = []

        try {
          const q = query(customersRef, orderByChild('mobile'), equalTo(currentUser.mobile))
          const snap = await get(q)
          if (snap.exists()) {
            const data = snap.val()
            results = Object.entries(data).map(([key, val]) => ({ key, ...val }))
          }
        } catch {
          // Fallback
          const allSnap = await get(customersRef)
          if (allSnap.exists()) {
            const data = allSnap.val()
            results = Object.entries(data)
              .filter(([, val]) => val.mobile === currentUser.mobile)
              .map(([key, val]) => ({ key, ...val }))
          }
        }

        setVehicles(results)
      } catch (err) {
        console.error('Fetch vehicles error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [open, currentUser?.mobile])

  const handleSwitchVehicle = (vehicle) => {
    loginUser(vehicle)
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content mv-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>

        <div className="mv-header">
          <div className="mv-icon">🚗</div>
          <h2>My Vehicles</h2>
          <p>All vehicles registered with +91 {currentUser.mobile}</p>
        </div>

        {loading ? (
          <div className="mv-loading">Loading vehicles...</div>
        ) : vehicles.length === 0 ? (
          <div className="mv-empty">No vehicles found</div>
        ) : (
          <div className="mv-list">
            {vehicles.map((v) => {
              const isActive = v.key === currentUser.key
              return (
                <div
                  key={v.key}
                  className={`mv-card ${isActive ? 'mv-card-active' : ''}`}
                  onClick={() => !isActive && handleSwitchVehicle(v)}
                >
                  <div className="mv-card-top">
                    <div className="mv-card-left">
                      <span className="mv-card-vnum">{v.vehicle}</span>
                      <span className="mv-card-id">{v.generatedId}</span>
                    </div>
                    {isActive && <span className="mv-active-badge">ACTIVE</span>}
                    {!isActive && <span className="mv-switch-badge">TAP TO SWITCH</span>}
                  </div>
                  <div className="mv-card-details">
                    <div className="mv-detail">
                      <span className="mv-detail-label">Plan</span>
                      <span className="mv-detail-value">{v.plan}</span>
                    </div>
                    <div className="mv-detail">
                      <span className="mv-detail-label">Status</span>
                      <span className="mv-detail-value" style={{ color: '#00c853' }}>{v.status}</span>
                    </div>
                    <div className="mv-detail">
                      <span className="mv-detail-label">Registered</span>
                      <span className="mv-detail-value">
                        {v.timestamp ? new Date(v.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="mv-count">{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</p>
      </div>
    </div>
  )
}

export default MyVehiclesModal
