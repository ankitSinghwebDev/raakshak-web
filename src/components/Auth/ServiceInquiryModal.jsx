import React, { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import './ServiceInquiryModal.css'

const ServiceInquiryModal = ({ open, onClose, serviceType }) => {
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    house: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    evVehicleType: 'Car',
    evModel: '',
    evInstallLoc: 'Home',
    evChargerType: 'Standard Home Charger (3.3 kW)',
    evElecType: 'Single Phase',
    evLoad: '',
    evDist: '0–10 meters',
    evParking: 'Private Garage',
    evWall: 'Yes',
    evSoc: 'No',
    evSocPerm: 'Yes',
  })

  const isEV = serviceType === 'ev-charger'

  const getTitle = () => {
    switch (serviceType) {
      case 'fastag-repair': return 'Fastag Re-activation'
      case 'fastag-new': return 'Instant Tag Issuance'
      case 'ev-charger': return 'EV Station Inquiry'
      default: return 'Applicant Details'
    }
  }

  const getDesc = () => {
    switch (serviceType) {
      case 'fastag-repair': return 'Re-activate your Blacklisted or Hotlisted tags easily.'
      case 'fastag-new': return 'Order a fresh Rakshak Fastag at your doorstep.'
      case 'ev-charger': return 'Professional technical survey for your EV charger installation.'
      default: return ''
    }
  }

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleClose = useCallback(() => {
    setFormData({
      name: '', number: '', house: '', landmark: '', city: '', state: '', pincode: '',
      evVehicleType: 'Car', evModel: '', evInstallLoc: 'Home',
      evChargerType: 'Standard Home Charger (3.3 kW)', evElecType: 'Single Phase',
      evLoad: '', evDist: '0–10 meters', evParking: 'Private Garage',
      evWall: 'Yes', evSoc: 'No', evSocPerm: 'Yes',
    })
    onClose()
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Save to Firebase
    toast.success('Request submitted successfully!')
    handleClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="service-modal-content glass-effect" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={handleClose}>&times;</span>
        <h2 className="service-modal-title">{getTitle()}</h2>
        <p className="service-modal-desc">{getDesc()}</p>

        <form onSubmit={handleSubmit} className="professional-form">
          <div className="form-row">
            <div className="input-container">
              <label>Full Name</label>
              <input type="text" placeholder="As per ID" value={formData.name} onChange={handleChange('name')} required />
            </div>
            <div className="input-container">
              <label>Contact Number</label>
              <input type="text" placeholder="10 Digit Mobile" maxLength={10} value={formData.number} onChange={handleChange('number')} required />
            </div>
          </div>

          <div className="input-container">
            <label>House No. / Flat Name</label>
            <input type="text" placeholder="House No." value={formData.house} onChange={handleChange('house')} required />
          </div>

          <div className="input-container">
            <label>Landmark</label>
            <input type="text" placeholder="Near by location" value={formData.landmark} onChange={handleChange('landmark')} required />
          </div>

          <div className="form-row">
            <div className="input-container">
              <label>City</label>
              <input type="text" placeholder="City" value={formData.city} onChange={handleChange('city')} required />
            </div>
            <div className="input-container">
              <label>State</label>
              <input type="text" placeholder="State" value={formData.state} onChange={handleChange('state')} required />
            </div>
          </div>

          <div className="input-container">
            <label>Pincode</label>
            <input type="text" placeholder="6 Digit" maxLength={6} value={formData.pincode} onChange={handleChange('pincode')} required />
          </div>

          {/* EV Extra Fields */}
          {isEV && (
            <div className="ev-extra-fields">
              <div className="input-container">
                <label>Which EV vehicle do you own?</label>
                <select value={formData.evVehicleType} onChange={handleChange('evVehicleType')} className="professional-select">
                  <option value="Car">Car</option>
                  <option value="Bike / Scooter">Bike / Scooter</option>
                  <option value="Truck / Fleet">Truck / Fleet</option>
                </select>
              </div>

              <div className="input-container">
                <label>Vehicle Model</label>
                <input type="text" placeholder="e.g. Tata Nexon EV" value={formData.evModel} onChange={handleChange('evModel')} />
              </div>

              <div className="input-container">
                <label>Installation Location?</label>
                <select value={formData.evInstallLoc} onChange={handleChange('evInstallLoc')} className="professional-select">
                  <option value="Home">Home</option>
                  <option value="Apartment Parking">Apartment Parking</option>
                  <option value="Office">Office</option>
                  <option value="Commercial Location">Commercial Location</option>
                </select>
              </div>

              <div className="input-container">
                <label>Charger Type Required</label>
                <select value={formData.evChargerType} onChange={handleChange('evChargerType')} className="professional-select">
                  <option value="Standard Home Charger (3.3 kW)">Standard Home Charger (3.3 kW)</option>
                  <option value="Fast Home Charger (7.4 kW)">Fast Home Charger (7.4 kW)</option>
                  <option value="Not Sure">Not Sure</option>
                </select>
              </div>

              <div className="input-container">
                <label>Electricity Connection Type</label>
                <select value={formData.evElecType} onChange={handleChange('evElecType')} className="professional-select">
                  <option value="Single Phase">Single Phase</option>
                  <option value="Three Phase">Three Phase</option>
                  <option value="Not Sure">Not Sure</option>
                </select>
              </div>

              <div className="input-container">
                <label>Current Load (kW)</label>
                <input type="number" placeholder="Current kW load" value={formData.evLoad} onChange={handleChange('evLoad')} />
              </div>

              <div className="input-container">
                <label>Distance to Meter (approx.)</label>
                <select value={formData.evDist} onChange={handleChange('evDist')} className="professional-select">
                  <option value="0–10 meters">0–10 meters</option>
                  <option value="10–20 meters">10–20 meters</option>
                  <option value="20+ meters">20+ meters</option>
                </select>
              </div>

              <div className="input-container">
                <label>Parking Type</label>
                <select value={formData.evParking} onChange={handleChange('evParking')} className="professional-select">
                  <option value="Private Garage">Private Garage</option>
                  <option value="Basement Parking">Basement Parking</option>
                  <option value="Open Parking">Open Parking</option>
                  <option value="Street Parking">Street Parking</option>
                </select>
              </div>

              <div className="input-container">
                <label>Is Wall Mounting Possible?</label>
                <select value={formData.evWall} onChange={handleChange('evWall')} className="professional-select">
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Not Sure">Not Sure</option>
                </select>
              </div>

              <div className="input-container">
                <label>Do you live in an apartment society?</label>
                <select value={formData.evSoc} onChange={handleChange('evSoc')} className="professional-select">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              {formData.evSoc === 'Yes' && (
                <div className="input-container">
                  <label>Society Permission Status?</label>
                  <select value={formData.evSocPerm} onChange={handleChange('evSocPerm')} className="professional-select">
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Will arrange">Will arrange</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn-service-submit">SUBMIT REQUEST</button>
        </form>
      </div>
    </div>
  )
}

export default ServiceInquiryModal
