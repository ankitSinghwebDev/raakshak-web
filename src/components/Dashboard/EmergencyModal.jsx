import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { db, ref, get, set } from '../../config/firebase'
import { useAppContext } from '../../context/AppContext'
import './EmergencyModal.css'

const BLOOD_GROUPS = ['Select', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const MEDICAL_CONDITIONS = [
  'No Known Medical Condition',
  'Diabetes',
  'Heart Issue',
  'Asthma',
  'Medicine Allergy',
]

const EmergencyModal = ({ open, onClose }) => {
  const { currentUser } = useAppContext()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    iceContact1: '',
    iceContact2: '',
    relation: '',
    bloodGroup: 'Select',
    age: '',
    conditions: [],
    medicines: '',
  })

  // Load existing emergency data on open
  useEffect(() => {
    if (!open || !currentUser?.key) return

    const loadData = async () => {
      setLoading(true)
      try {
        const emergencyRef = ref(db, `customers/${currentUser.key}/emergency`)
        const snapshot = await get(emergencyRef)
        if (snapshot.exists()) {
          const data = snapshot.val()
          setFormData({
            iceContact1: data.iceContact1 || '',
            iceContact2: data.iceContact2 || '',
            relation: data.relation || '',
            bloodGroup: data.bloodGroup || 'Select',
            age: data.age || '',
            conditions: data.conditions || [],
            medicines: data.medicines || '',
          })
        }
      } catch (err) {
        console.error('Error loading emergency data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [open, currentUser?.key])

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleConditionToggle = (condition) => {
    setFormData((prev) => {
      const exists = prev.conditions.includes(condition)
      if (condition === 'No Known Medical Condition') {
        return { ...prev, conditions: exists ? [] : [condition] }
      }
      const filtered = prev.conditions.filter((c) => c !== 'No Known Medical Condition')
      return {
        ...prev,
        conditions: exists ? filtered.filter((c) => c !== condition) : [...filtered, condition],
      }
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.iceContact1 || !formData.relation || formData.bloodGroup === 'Select' || !formData.age) {
      toast.error('Please fill all required fields')
      return
    }

    setSaving(true)
    try {
      const emergencyRef = ref(db, `customers/${currentUser.key}/emergency`)
      await set(emergencyRef, {
        iceContact1: formData.iceContact1,
        iceContact2: formData.iceContact2,
        relation: formData.relation,
        bloodGroup: formData.bloodGroup,
        age: formData.age,
        conditions: formData.conditions,
        medicines: formData.medicines,
        updatedAt: new Date().toISOString(),
      })
      toast.success('Emergency data saved successfully!')
      onClose()
    } catch (err) {
      console.error('Error saving emergency data:', err)
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleModalClose = useCallback(() => {
    onClose()
  }, [onClose])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleModalClose}>
      <div className="modal-content emergency-modal" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={handleModalClose}>&times;</span>

        <h2 className="emergency-title">Emergency Profile</h2>
        <p className="emergency-subtitle">ICE (In Case of Emergency) Data for Scanners.</p>

        {loading ? (
          <div className="emergency-loading">Loading emergency data...</div>
        ) : (
          <form onSubmit={handleSave}>
            {/* ICE Contact 1 */}
            <div className="em-field">
              <label>ICE CONTACT 1 (REQUIRED)</label>
              <input
                type="text"
                placeholder="9876543210"
                maxLength={10}
                value={formData.iceContact1}
                onChange={(e) => setFormData((p) => ({ ...p, iceContact1: e.target.value.replace(/\D/g, '') }))}
                inputMode="numeric"
                required
              />
            </div>

            {/* ICE Contact 2 */}
            <div className="em-field">
              <label>ICE CONTACT 2</label>
              <input
                type="text"
                placeholder="9876543211"
                maxLength={10}
                value={formData.iceContact2}
                onChange={(e) => setFormData((p) => ({ ...p, iceContact2: e.target.value.replace(/\D/g, '') }))}
                inputMode="numeric"
              />
            </div>

            {/* Relation */}
            <div className="em-field">
              <label>RELATION / NOTE (REQUIRED)</label>
              <input
                type="text"
                placeholder="Parent / Spouse / Friend"
                value={formData.relation}
                onChange={handleChange('relation')}
                required
              />
            </div>

            {/* Blood Group + Age */}
            <div className="em-row">
              <div className="em-field">
                <label>BLOOD GROUP (REQUIRED)</label>
                <select value={formData.bloodGroup} onChange={handleChange('bloodGroup')} required>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div className="em-field">
                <label>AGE (REQUIRED)</label>
                <input
                  type="text"
                  placeholder="25"
                  maxLength={3}
                  value={formData.age}
                  onChange={(e) => setFormData((p) => ({ ...p, age: e.target.value.replace(/\D/g, '') }))}
                  inputMode="numeric"
                  required
                />
              </div>
            </div>

            {/* Medical Conditions */}
            <div className="em-field">
              <label>CURRENT MEDICAL CONDITION</label>
              <div className="em-conditions-grid">
                {MEDICAL_CONDITIONS.map((cond) => (
                  <label key={cond} className="em-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.conditions.includes(cond)}
                      onChange={() => handleConditionToggle(cond)}
                    />
                    <span>{cond}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Regular Medicines */}
            <div className="em-field">
              <label>REGULAR MEDICINES / DETAILS</label>
              <textarea
                placeholder="Medicine name or specific details..."
                value={formData.medicines}
                onChange={handleChange('medicines')}
                rows={3}
              />
            </div>

            <button type="submit" className="em-save-btn" disabled={saving}>
              {saving ? 'Saving...' : 'SAVE EMERGENCY DATA ➔'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default EmergencyModal
