import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  PlusOutlined, DownloadOutlined, EditOutlined,
  CheckCircleOutlined, StopOutlined, DollarOutlined,
  CopyOutlined, QrcodeOutlined,
} from '@ant-design/icons'
import { Tag } from 'antd'
import { db, ref, get, push, set, update } from '../../config/firebase'
import { logAdminAction, ACTIONS } from '../../utils/auditLog'
import { generateQRCodeUrl } from '../../utils/helpers'
import { ListSkeleton } from './AdminSkeleton'
import logoImg from '../../assets/icons/Rakshak.jpg'

const DEFAULT_TYPE_OPTIONS = ['Car Accessories', 'Car Service Center', 'Showroom']

const EMPTY_PARTNER_FORM = {
  name: '',
  shop: '',
  type: '',
  mobile: '',
  address: '',
  city: '',
  state: '',
  pin: '',
  comm: '',
}

const TYPE_PREFIX = {
  'Car Accessories': 'RAKACCE',
  'Car Service Center': 'RAKCSS',
  'Showroom': 'RAKSR',
}

const toCaps = (value) => value.toUpperCase()

const getPrefixForType = (type) => TYPE_PREFIX[type] || 'RAKNEW'

const extractCodeCounter = (code, prefix) => {
  const match = String(code || '').match(new RegExp(`^${prefix}(\\d+)$`))
  return match ? Number(match[1]) : 0
}

const generatePartnerCode = (type, partners, editingKey = null) => {
  const prefix = getPrefixForType(type)
  const maxCounter = partners.reduce((max, partner) => {
    if (partner.key === editingKey) return max
    return Math.max(max, extractCodeCounter(partner.code, prefix))
  }, 0)
  return `${prefix}${String(maxCounter + 1).padStart(2, '0')}`
}

const getPartnerQrValue = (partner) => `${window.location.origin}/?coupon=${partner.code}`

const escapeXml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;')

const buildPartnerCardSvg = (partner) => {
  const logoUrl = logoImg.startsWith('http') ? logoImg : new URL(logoImg, window.location.origin).href
  const qrUrl = generateQRCodeUrl(getPartnerQrValue(partner), 220)
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="560" viewBox="0 0 420 560">
  <rect width="420" height="560" rx="28" fill="#0b0b0b" stroke="#F28C38" stroke-width="4"/>
  <rect x="26" y="26" width="368" height="508" rx="22" fill="#101010"/>
  <image href="${escapeXml(logoUrl)}" x="156" y="36" width="108" height="108" preserveAspectRatio="xMidYMid meet"/>
  <text x="210" y="175" text-anchor="middle" fill="#ffffff" font-size="26" font-weight="800" font-family="Arial, sans-serif">Rakshak Partner</text>
  <text x="210" y="202" text-anchor="middle" fill="#8b8b8b" font-size="11" letter-spacing="4" font-family="Arial, sans-serif">DEALER ACCESS CARD</text>
  <rect x="80" y="222" width="260" height="56" rx="18" fill="#F28C38"/>
  <text x="210" y="257" text-anchor="middle" fill="#000000" font-size="26" font-weight="900" letter-spacing="2" font-family="Arial, sans-serif">${escapeXml(partner.code)}</text>
  <text x="210" y="314" text-anchor="middle" fill="#ffffff" font-size="24" font-weight="800" font-family="Arial, sans-serif">${escapeXml(partner.name)}</text>
  <text x="210" y="340" text-anchor="middle" fill="#F28C38" font-size="15" font-weight="700" font-family="Arial, sans-serif">${escapeXml(partner.shop)}</text>
  <text x="210" y="362" text-anchor="middle" fill="#7d7d7d" font-size="12" font-family="Arial, sans-serif">${escapeXml(partner.type)}</text>
  <rect x="120" y="382" width="180" height="122" rx="20" fill="#ffffff"/>
  <image href="${escapeXml(qrUrl)}" x="136" y="398" width="148" height="90" preserveAspectRatio="xMidYMid meet"/>
  <text x="210" y="520" text-anchor="middle" fill="#9a9a9a" font-size="12" font-family="Arial, sans-serif">Show this code during Rakshak onboarding</text>
</svg>`.trim()
}

const PartnerManagement = () => {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [partnerForm, setPartnerForm] = useState(EMPTY_PARTNER_FORM)
  const [editingPartner, setEditingPartner] = useState(null)
  const [savingPartner, setSavingPartner] = useState(false)
  const [previewPartner, setPreviewPartner] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [viewingPartner, setViewingPartner] = useState(null)
  const [partnerCustomers, setPartnerCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  const typeOptions = useMemo(() => {
    const dynamicTypes = partners
      .map((partner) => partner.type)
      .filter(Boolean)
      .filter((type, index, arr) => arr.indexOf(type) === index && !DEFAULT_TYPE_OPTIONS.includes(type))
    return [...DEFAULT_TYPE_OPTIONS, ...dynamicTypes]
  }, [partners])

  const refreshPartners = async () => {
    const snap = await get(ref(db, 'partners'))
    if (!snap.exists()) {
      setPartners([])
      return []
    }
    const nextPartners = Object.entries(snap.val())
      .map(([key, val]) => ({ key, ...val }))
      .sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0))
    setPartners(nextPartners)
    return nextPartners
  }

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        await refreshPartners()
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPartners()
  }, [])

  const openCreateModal = () => {
    setEditingPartner(null)
    setPartnerForm(EMPTY_PARTNER_FORM)
    setShowFormModal(true)
  }

  const openEditModal = (partner) => {
    setEditingPartner(partner)
    setPartnerForm({
      name: partner.name || '',
      shop: partner.shop || '',
      type: partner.type || '',
      mobile: partner.mobile || '',
      address: partner.address || '',
      city: partner.city || '',
      state: partner.state || '',
      pin: partner.pin || '',
      comm: String(partner.comm ?? ''),
    })
    setShowFormModal(true)
  }

  const closeFormModal = () => {
    setShowFormModal(false)
    setEditingPartner(null)
    setPartnerForm(EMPTY_PARTNER_FORM)
  }

  const handleFormChange = (field, value) => {
    setPartnerForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddNewType = () => {
    const nextType = window.prompt('Enter new shop type')
    if (!nextType) return
    const cleaned = nextType.trim()
    if (!cleaned) return
    handleFormChange('type', cleaned)
    toast.success(`Shop type added: ${cleaned}`)
  }

  const validatePartnerForm = () => {
    const { name, shop, type, mobile, address, city, state, pin, comm } = partnerForm
    if (!name || !shop || !type || !mobile || !address || !city || !state || !pin || !comm) {
      toast.error('All starred fields are mandatory.')
      return false
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error('Enter a valid 10-digit mobile number.')
      return false
    }
    if (!/^\d{6}$/.test(pin)) {
      toast.error('Enter a valid 6-digit pin code.')
      return false
    }
    if (Number(comm) <= 0) {
      toast.error('Commission amount must be greater than 0.')
      return false
    }
    return true
  }

  const buildPartnerPayload = () => {
    const code = editingPartner?.code || generatePartnerCode(partnerForm.type, partners, editingPartner?.key)
    return {
      name: toCaps(partnerForm.name.trim()),
      shop: toCaps(partnerForm.shop.trim()),
      type: partnerForm.type.trim(),
      mobile: partnerForm.mobile.trim(),
      address: toCaps(partnerForm.address.trim()),
      city: toCaps(partnerForm.city.trim()),
      state: toCaps(partnerForm.state.trim()),
      pin: partnerForm.pin.trim(),
      comm: Number(partnerForm.comm),
      code,
      status: editingPartner?.status || 'active',
      totalSales: editingPartner?.totalSales || 0,
      totalRevenue: editingPartner?.totalRevenue || 0,
      pendingComm: editingPartner?.pendingComm || 0,
      createdAt: editingPartner?.createdAt || new Date().toISOString(),
      timestamp: editingPartner?.timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const handleSubmitPartner = async (e) => {
    e.preventDefault()
    if (!validatePartnerForm()) return

    setSavingPartner(true)
    try {
      const partnerData = buildPartnerPayload()
      if (editingPartner) {
        await update(ref(db, `partners/${editingPartner.key}`), partnerData)
        await logAdminAction(ACTIONS.PARTNER_UPDATED, editingPartner.key, partnerData.name, {
          code: partnerData.code,
          action: 'updated',
        })
        toast.success('Partner updated successfully!')
        setPreviewPartner({ key: editingPartner.key, ...partnerData })
      } else {
        const partnerRef = push(ref(db, 'partners'))
        await set(partnerRef, partnerData)
        await logAdminAction(ACTIONS.PARTNER_CREATED, partnerRef.key, partnerData.name, {
          code: partnerData.code,
          shop: partnerData.shop,
          type: partnerData.type,
        })
        toast.success('Partner created successfully!')
        setPreviewPartner({ key: partnerRef.key, ...partnerData })
      }

      await refreshPartners()
      closeFormModal()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save partner.')
    } finally {
      setSavingPartner(false)
    }
  }

  const handleDownloadCard = (partner) => {
    try {
      const svgMarkup = buildPartnerCardSvg(partner)
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${partner.code}_partner_card.svg`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      toast.error('Failed to download partner card.')
    }
  }

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Partner code copied!')
    } catch {
      toast.error('Failed to copy code.')
    }
  }

  const toggleStatus = async (partner) => {
    const newStatus = partner.status === 'active' ? 'inactive' : 'active'
    try {
      await update(ref(db, `partners/${partner.key}`), { status: newStatus, updatedAt: new Date().toISOString() })
      setPartners((prev) => prev.map((p) => (p.key === partner.key ? { ...p, status: newStatus } : p)))
      await logAdminAction(
        newStatus === 'active' ? ACTIONS.PARTNER_ACTIVATED : ACTIONS.PARTNER_DEACTIVATED,
        partner.key,
        partner.name,
        { code: partner.code }
      )
      toast.success(`${partner.name} ${newStatus}`)
    } catch {
      toast.error('Failed')
    }
  }

  const markPaid = async (partner) => {
    try {
      const paidAmount = partner.pendingComm || 0
      await update(ref(db, `partners/${partner.key}`), { pendingComm: 0, lastPaidAt: new Date().toISOString() })
      await push(ref(db, `payoutHistory/${partner.key}`), {
        amount: paidAmount,
        partnerName: partner.name,
        code: partner.code,
        paidAt: new Date().toISOString(),
        paidBy: JSON.parse(sessionStorage.getItem('rakshak_admin') || '{}').name || 'Admin',
      })
      setPartners((prev) => prev.map((p) => (p.key === partner.key ? { ...p, pendingComm: 0 } : p)))
      await logAdminAction(ACTIONS.PARTNER_COMMISSION_PAID, partner.key, partner.name, { amount: paidAmount })
      toast.success(`₹${paidAmount} commission paid for ${partner.name}`)
    } catch {
      toast.error('Failed')
    }
  }

  const viewPartnerCustomers = async (partner) => {
    setViewingPartner(partner)
    setLoadingCustomers(true)
    try {
      const snap = await get(ref(db, 'customers'))
      if (snap.exists()) {
        const all = Object.entries(snap.val()).map(([k, v]) => ({ key: k, ...v }))
        setPartnerCustomers(all.filter((c) => c.coupon?.toUpperCase() === partner.code?.toUpperCase()))
      } else {
        setPartnerCustomers([])
      }
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const handleExportPartners = () => {
    setExporting(true)
    try {
      const rows = partners.map((p) => ({
        'Partner Name': p.name || '—',
        'Shop Name': p.shop || '—',
        'Shop Type': p.type || '—',
        'Partner Code': p.code || '—',
        'Mobile': p.mobile || '—',
        'Address': p.address || '—',
        'City': p.city || '—',
        'State': p.state || '—',
        'Pin Code': p.pin || '—',
        'Commission Amount (₹)': p.comm || 0,
        'Total Sales': p.totalSales || 0,
        'Total Revenue (₹)': p.totalRevenue || 0,
        'Pending Commission (₹)': p.pendingComm || 0,
        'Status': (p.status || 'active').toUpperCase(),
        'Created': p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—',
      }))
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'No Data': 'No partners found' }])
      ws['!cols'] = Object.keys(rows[0] || {}).map((key) => ({ wch: Math.max(key.length + 2, 16) }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Partners')
      XLSX.writeFile(wb, `Rakshak_Partners_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Partners exported!')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <ListSkeleton />

  return (
    <div>
      <div className="adm-toolbar">
        <span className="adm-result-count">{partners.length} partners</span>
        <button className="adm-icon-btn adm-icon-export" onClick={handleExportPartners} disabled={exporting} title="Download Excel">
          <DownloadOutlined />
        </button>
        <button className="adm-add-btn" onClick={openCreateModal}>
          <PlusOutlined /> Add Partner
        </button>
      </div>

      {showFormModal && (
        <div className="adm-modal-overlay" onClick={closeFormModal}>
          <div className="adm-modal adm-partner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h4 className="adm-modal-title">
                {editingPartner ? <><EditOutlined /> Update Partner</> : <><PlusOutlined /> Create Partner</>}
              </h4>
              <button className="adm-modal-close" onClick={closeFormModal}>✕</button>
            </div>
            <div className="adm-modal-body">
              <form onSubmit={handleSubmitPartner} className="adm-partner-form-grid">
                <div className="adm-field adm-partner-form-full">
                  <label>Partner Name (A) *</label>
                  <input
                    className="adm-field-input"
                    placeholder="PARTNER NAME"
                    value={partnerForm.name}
                    onChange={(e) => handleFormChange('name', toCaps(e.target.value))}
                    required
                  />
                </div>

                <div className="adm-field adm-partner-form-full">
                  <label>Shop Name (B) *</label>
                  <input
                    className="adm-field-input"
                    placeholder="SHOP NAME"
                    value={partnerForm.shop}
                    onChange={(e) => handleFormChange('shop', toCaps(e.target.value))}
                    required
                  />
                </div>

                <div className="adm-field">
                  <label>Shop Type (C) *</label>
                  <select
                    className="adm-field-input"
                    value={partnerForm.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    required
                  >
                    <option value="">Select Type</option>
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <button type="button" className="adm-partner-inline-link" onClick={handleAddNewType}>
                    + Add New Type
                  </button>
                </div>

                <div className="adm-field">
                  <label>Mobile Number (D) *</label>
                  <input
                    className="adm-field-input"
                    placeholder="10 Digit Number"
                    inputMode="numeric"
                    maxLength={10}
                    value={partnerForm.mobile}
                    onChange={(e) => handleFormChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                  />
                </div>

                <div className="adm-field adm-partner-form-full">
                  <label>Full Address (E) *</label>
                  <input
                    className="adm-field-input"
                    placeholder="STREET / AREA NAME"
                    value={partnerForm.address}
                    onChange={(e) => handleFormChange('address', toCaps(e.target.value))}
                    required
                  />
                </div>

                <div className="adm-partner-location-grid adm-partner-form-full">
                  <div className="adm-field">
                    <label>City *</label>
                    <input
                      className="adm-field-input"
                      placeholder="CITY"
                      value={partnerForm.city}
                      onChange={(e) => handleFormChange('city', toCaps(e.target.value))}
                      required
                    />
                  </div>
                  <div className="adm-field">
                    <label>State *</label>
                    <input
                      className="adm-field-input"
                      placeholder="STATE"
                      value={partnerForm.state}
                      onChange={(e) => handleFormChange('state', toCaps(e.target.value))}
                      required
                    />
                  </div>
                  <div className="adm-field">
                    <label>Pin Code *</label>
                    <input
                      className="adm-field-input"
                      placeholder="PIN"
                      inputMode="numeric"
                      maxLength={6}
                      value={partnerForm.pin}
                      onChange={(e) => handleFormChange('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                    />
                  </div>
                </div>

                <div className="adm-field adm-partner-form-full">
                  <label>Commission Amount (F) *</label>
                  <input
                    className="adm-field-input"
                    type="number"
                    min="1"
                    placeholder="Amount in Rupees (₹)"
                    value={partnerForm.comm}
                    onChange={(e) => handleFormChange('comm', e.target.value)}
                    required
                  />
                </div>

                <div className="adm-partner-note adm-partner-form-full">
                  <strong>Partner code preview:</strong>
                  {' '}
                  {editingPartner?.code || (partnerForm.type ? generatePartnerCode(partnerForm.type, partners, editingPartner?.key) : 'Select shop type first')}
                </div>

                <button type="submit" className="adm-add-btn adm-partner-form-full adm-partner-submit" disabled={savingPartner}>
                  {savingPartner ? 'Saving...' : (editingPartner ? 'Update & Preview Card' : 'Submit & Generate Code')}
                </button>
                <button type="button" className="adm-partner-cancel adm-partner-form-full" onClick={closeFormModal}>
                  Close
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {previewPartner && (
        <div className="adm-modal-overlay" onClick={() => setPreviewPartner(null)}>
          <div className="adm-modal adm-partner-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h4 className="adm-modal-title"><QrcodeOutlined /> Rakshak Partner Card Preview</h4>
              <button className="adm-modal-close" onClick={() => setPreviewPartner(null)}>✕</button>
            </div>
            <div className="adm-modal-body adm-partner-preview-body">
              <div className="adm-partner-preview-card">
                <img src={logoImg} alt="Rakshak" className="adm-partner-preview-logo" />
                <p className="adm-partner-preview-kicker">Partner Access Card</p>
                <h3 className="adm-partner-preview-name">{previewPartner.name}</h3>
                <p className="adm-partner-preview-shop">{previewPartner.shop}</p>
                <p className="adm-partner-preview-type">{previewPartner.type}</p>
                <div className="adm-partner-preview-code">{previewPartner.code}</div>
                <div className="adm-partner-preview-qr-wrap">
                  <img
                    src={generateQRCodeUrl(getPartnerQrValue(previewPartner), 220)}
                    alt="Partner QR"
                    className="adm-partner-preview-qr"
                  />
                </div>
                <div className="adm-partner-preview-meta">
                  <span>+91 {previewPartner.mobile}</span>
                  <span>Commission: ₹{Number(previewPartner.comm || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="adm-partner-preview-info">
                <div className="adm-partner-code-box">
                  <span>Partner Code</span>
                  <strong>{previewPartner.code}</strong>
                  <button type="button" onClick={() => handleCopyCode(previewPartner.code)}><CopyOutlined /> Copy</button>
                </div>
                <p>Share this partner card or code during Rakshak onboarding. Registrations using this code will be tracked under this partner.</p>
              </div>

              <div className="adm-partner-preview-actions">
                <button className="adm-add-btn" onClick={() => handleDownloadCard(previewPartner)}>
                  <DownloadOutlined /> Download Card
                </button>
                <button className="adm-partner-cancel" onClick={() => setPreviewPartner(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="adm-table-wrap adm-partner-table-wrap adm-desktop-only">
        <table className="adm-table adm-table-fixed adm-partner-table">
          <thead>
            <tr>
              <th className="adm-sticky-left adm-sticky-left-1">Partner</th>
              <th className="adm-sticky-left adm-sticky-left-2">Shop</th>
              <th>Type</th>
              <th>Code</th>
              <th>Mobile</th>
              <th>Sales</th>
              <th>Revenue</th>
              <th>Commission ₹</th>
              <th>Pending ₹</th>
              <th>Status</th>
              <th className="adm-sticky-right adm-sticky-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.key} className={partner.status !== 'active' ? 'adm-row-suspended' : ''}>
                <td className="adm-td-name adm-sticky-left adm-sticky-left-1" data-tooltip={partner.name}>{partner.name}</td>
                <td className="adm-sticky-left adm-sticky-left-2" data-tooltip={partner.shop || '—'}>{partner.shop || '—'}</td>
                <td data-tooltip={partner.type || '—'}>{partner.type || '—'}</td>
                <td className="adm-td-vehicle" data-tooltip={partner.code}>{partner.code}</td>
                <td data-tooltip={partner.mobile || '—'}>{partner.mobile || '—'}</td>
                <td>{partner.totalSales || 0}</td>
                <td>₹{(partner.totalRevenue || 0).toLocaleString()}</td>
                <td>₹{(partner.comm || 0).toLocaleString()}</td>
                <td style={{ color: (partner.pendingComm || 0) > 0 ? 'var(--accent)' : 'var(--text-dim)' }}>
                  ₹{(partner.pendingComm || 0).toLocaleString()}
                </td>
                <td><Tag color={partner.status === 'active' ? 'green' : 'red'}>{partner.status}</Tag></td>
                <td className="adm-sticky-right adm-sticky-actions">
                  <div className="adm-actions">
                    <button className="adm-btn-sm" onClick={() => openEditModal(partner)} title="Edit Partner">
                      <EditOutlined />
                    </button>
                    <button className={`adm-btn-sm ${partner.status === 'active' ? 'adm-btn-red' : 'adm-btn-green'}`} onClick={() => toggleStatus(partner)} title={partner.status === 'active' ? 'Deactivate' : 'Activate'}>
                      {partner.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                    </button>
                    {(partner.pendingComm || 0) > 0 && (
                      <button className="adm-btn-sm adm-btn-green" onClick={() => markPaid(partner)} title="Mark as Paid">
                        <DollarOutlined />
                      </button>
                    )}
                    <button className="adm-btn-sm" onClick={() => setPreviewPartner(partner)} title="View Partner Card">
                      <QrcodeOutlined />
                    </button>
                    <button className="adm-btn-sm" onClick={() => viewPartnerCustomers(partner)} title="View Customers">👥</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adm-card-list adm-mobile-only">
        {partners.map((partner) => (
          <div key={partner.key} className={`adm-card ${partner.status !== 'active' ? 'adm-card-suspended' : ''}`}>
            <div className="adm-card-row adm-card-row-between">
              <span className="adm-card-name">{partner.name}</span>
              <Tag color={partner.status === 'active' ? 'green' : 'red'}>{partner.status}</Tag>
            </div>
            <div className="adm-card-row">
              <span className="adm-card-vehicle">{partner.code}</span>
            </div>
            <div className="adm-card-row">
              <span className="adm-card-sub">{partner.shop}</span>
            </div>
            <div className="adm-card-row">
              <span className="adm-card-sub">{partner.type}</span>
              <span className="adm-card-sub">+91 {partner.mobile}</span>
            </div>

            <div className="adm-partner-stats">
              <div className="adm-partner-stat">
                <span className="adm-partner-stat-value">{partner.totalSales || 0}</span>
                <span className="adm-partner-stat-label">Sales</span>
              </div>
              <div className="adm-partner-stat">
                <span className="adm-partner-stat-value">₹{(partner.totalRevenue || 0).toLocaleString()}</span>
                <span className="adm-partner-stat-label">Revenue</span>
              </div>
              <div className="adm-partner-stat">
                <span className="adm-partner-stat-value">₹{(partner.comm || 0).toLocaleString()}</span>
                <span className="adm-partner-stat-label">Comm</span>
              </div>
              <div className="adm-partner-stat">
                <span className="adm-partner-stat-value" style={{ color: (partner.pendingComm || 0) > 0 ? 'var(--accent)' : 'var(--text-dim)' }}>
                  ₹{(partner.pendingComm || 0).toLocaleString()}
                </span>
                <span className="adm-partner-stat-label">Pending</span>
              </div>
            </div>

            <div className="adm-card-actions">
              <button className="adm-action-btn" onClick={() => openEditModal(partner)}>
                <EditOutlined /> Edit
              </button>
              <button className={`adm-action-btn ${partner.status === 'active' ? 'adm-action-red' : 'adm-action-green'}`} onClick={() => toggleStatus(partner)}>
                {partner.status === 'active' ? <><StopOutlined /> Deactivate</> : <><CheckCircleOutlined /> Activate</>}
              </button>
              {(partner.pendingComm || 0) > 0 && (
                <button className="adm-action-btn adm-action-green" onClick={() => markPaid(partner)}>
                  <DollarOutlined /> Mark Paid
                </button>
              )}
              <button className="adm-action-btn" onClick={() => setPreviewPartner(partner)}>
                <QrcodeOutlined /> Partner Card
              </button>
              <button className="adm-action-btn" onClick={() => viewPartnerCustomers(partner)}>
                👥 View Customers
              </button>
            </div>
          </div>
        ))}
        {partners.length === 0 && <p className="adm-empty">No partners yet</p>}
      </div>

      {viewingPartner && (
        <div className="adm-modal-overlay" onClick={() => setViewingPartner(null)}>
          <div className="adm-modal" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h4 className="adm-modal-title">👥 Customers — {viewingPartner.name} ({viewingPartner.code})</h4>
              <button className="adm-modal-close" onClick={() => setViewingPartner(null)}>✕</button>
            </div>
            <div className="adm-modal-body">
              {loadingCustomers ? (
                <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Loading...</p>
              ) : partnerCustomers.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No customers found for this partner code</p>
              ) : (
                <>
                  <p style={{ color: '#888', fontSize: '12px', marginBottom: '14px' }}>{partnerCustomers.length} customers acquired</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                    {partnerCustomers.map((customer) => (
                      <div key={customer.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ color: '#fff', fontWeight: 900, fontSize: '14px' }}>{customer.name}</span>
                          <Tag color={customer.status === 'Suspended' ? 'red' : 'green'}>{customer.status}</Tag>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#F28C38', fontWeight: 900, fontSize: '13px' }}>{customer.vehicle}</span>
                          <span style={{ color: '#888', fontSize: '12px' }}>{customer.mobile}</span>
                          <span style={{ color: '#666', fontSize: '11px' }}>{customer.plan}</span>
                          <span style={{ color: '#666', fontSize: '11px' }}>₹{customer.amount}</span>
                          <span style={{ color: '#555', fontSize: '10px' }}>{customer.timestamp ? new Date(customer.timestamp).toLocaleDateString('en-IN') : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PartnerManagement
