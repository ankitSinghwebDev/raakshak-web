import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  PlusOutlined, DownloadOutlined,
  CheckCircleOutlined, StopOutlined, DollarOutlined,
  CopyOutlined, QrcodeOutlined,
} from '@ant-design/icons'
import { Tag } from 'antd'
import { db, ref, get, push, set, update } from '../../config/firebase'
import { logAdminAction, ACTIONS } from '../../utils/auditLog'
import { generateQRCodeUrl } from '../../utils/helpers'
import { ListSkeleton } from './AdminSkeleton'

const generateReferralCode = (name) => {
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `RK-${prefix}-${rand}`
}

const PartnerManagement = () => {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPartner, setNewPartner] = useState({ name: '', code: '', comm: '' })
  const [addingPartner, setAddingPartner] = useState(false)
  const [createdPartner, setCreatedPartner] = useState(null) // shows QR success modal
  const [exporting, setExporting] = useState(false)
  const [viewingPartner, setViewingPartner] = useState(null) // partner whose customers we're viewing
  const [partnerCustomers, setPartnerCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await get(ref(db, 'partners'))
        if (snap.exists()) {
          const data = snap.val()
          setPartners(Object.entries(data).map(([key, val]) => ({ key, ...val })))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleAddPartner = async (e) => {
    e.preventDefault()
    if (!newPartner.name || !newPartner.code) { toast.error('Fill all fields'); return }
    setAddingPartner(true)
    try {
      const referralCode = generateReferralCode(newPartner.name)
      const partnerRef = push(ref(db, 'partners'))
      const partnerData = {
        name: newPartner.name,
        code: newPartner.code.toUpperCase(),
        referralCode,
        comm: parseFloat(newPartner.comm) || 0,
        totalSales: 0,
        totalRevenue: 0,
        pendingComm: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      await set(partnerRef, partnerData)
      await logAdminAction(ACTIONS.PARTNER_CREATED, newPartner.code, newPartner.name, { comm: newPartner.comm, referralCode })
      toast.success('Partner added!')
      setShowAddModal(false)
      setNewPartner({ name: '', code: '', comm: '' })
      setCreatedPartner({ key: partnerRef.key, ...partnerData })
      const snap = await get(ref(db, 'partners'))
      if (snap.exists()) setPartners(Object.entries(snap.val()).map(([key, val]) => ({ key, ...val })))
    } catch {
      toast.error('Failed to add partner')
    } finally {
      setAddingPartner(false)
    }
  }

  const toggleStatus = async (partner) => {
    const newStatus = partner.status === 'active' ? 'inactive' : 'active'
    try {
      await update(ref(db, `partners/${partner.key}`), { status: newStatus })
      setPartners((prev) => prev.map((p) => p.key === partner.key ? { ...p, status: newStatus } : p))
      await logAdminAction(
        newStatus === 'active' ? ACTIONS.PARTNER_ACTIVATED : ACTIONS.PARTNER_DEACTIVATED,
        partner.key, partner.name, { code: partner.code }
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
      // Save payout record
      await push(ref(db, `payoutHistory/${partner.key}`), {
        amount: paidAmount,
        partnerName: partner.name,
        code: partner.code,
        paidAt: new Date().toISOString(),
        paidBy: JSON.parse(sessionStorage.getItem('rakshak_admin') || '{}').name || 'Admin',
      })
      setPartners((prev) => prev.map((p) => p.key === partner.key ? { ...p, pendingComm: 0 } : p))
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
        'Name': p.name || '—',
        'Coupon Code': p.code || '—',
        'Status': (p.status || 'active').toUpperCase(),
        'Commission %': p.comm || 0,
        'Total Sales': p.totalSales || 0,
        'Total Revenue (₹)': p.totalRevenue || 0,
        'Pending Commission (₹)': p.pendingComm || 0,
        'Created': p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length + 2, 14) }))
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
        <button className="adm-add-btn" onClick={() => setShowAddModal(true)}>
          <PlusOutlined /> Add Partner
        </button>
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="adm-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h4 className="adm-modal-title"><PlusOutlined /> Add New Partner</h4>
              <button className="adm-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <form onSubmit={handleAddPartner} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="adm-field">
                  <label>Partner Name</label>
                  <input placeholder="Enter partner's full name" value={newPartner.name} onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })} required className="adm-field-input" />
                </div>
                <div className="adm-field">
                  <label>Coupon Code</label>
                  <input placeholder="e.g. PARTNER50" value={newPartner.code} onChange={(e) => setNewPartner({ ...newPartner, code: e.target.value.toUpperCase() })} required className="adm-field-input" />
                  <span style={{ color: '#666', fontSize: '10px', marginTop: '4px', display: 'block' }}>This code will be shared with customers for discounts</span>
                </div>
                <div className="adm-field">
                  <label>Commission %</label>
                  <input placeholder="e.g. 10" type="number" min="0" max="100" value={newPartner.comm} onChange={(e) => setNewPartner({ ...newPartner, comm: e.target.value })} className="adm-field-input" />
                </div>
                <p style={{ color: '#888', fontSize: '11px', background: 'rgba(242,140,56,0.08)', padding: '10px 14px', borderRadius: '10px', lineHeight: '1.5' }}>
                  A unique <strong style={{ color: '#F28C38' }}>Referral Code</strong> & <strong style={{ color: '#F28C38' }}>QR Code</strong> will be auto-generated for this partner upon creation.
                </p>
                <button type="submit" className="adm-add-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }} disabled={addingPartner}>
                  {addingPartner ? 'Creating...' : <><PlusOutlined /> Add Partner</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Partner Created — QR & Referral Code Modal */}
      {createdPartner && (
        <div className="adm-modal-overlay" onClick={() => setCreatedPartner(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h4 className="adm-modal-title"><QrcodeOutlined /> Partner Created</h4>
              <button className="adm-modal-close" onClick={() => setCreatedPartner(null)}>✕</button>
            </div>
            <div className="adm-modal-body" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#22c55e', fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>Partner added successfully!</p>
                <p style={{ color: '#aaa', fontSize: '12px' }}>{createdPartner.name}</p>
              </div>

              <div style={{ background: '#fff', borderRadius: '16px', display: 'inline-block', padding: '16px', marginBottom: '16px' }}>
                <img
                  src={generateQRCodeUrl(`${window.location.origin}/?ref=${createdPartner.referralCode}`, 200)}
                  alt="Partner QR"
                  style={{ width: '180px', height: '180px' }}
                />
              </div>

              <div style={{ background: 'rgba(242,140,56,0.08)', border: '1px solid rgba(242,140,56,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                <p style={{ color: '#888', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px' }}>REFERRAL CODE</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{ color: '#F28C38', fontSize: '20px', fontWeight: 900, letterSpacing: '2px' }}>{createdPartner.referralCode}</span>
                  <button
                    style={{ background: 'none', border: '1px solid #444', borderRadius: '8px', color: '#aaa', padding: '6px 10px', cursor: 'pointer', fontSize: '13px' }}
                    onClick={() => { navigator.clipboard.writeText(createdPartner.referralCode); toast.success('Referral code copied!') }}
                    title="Copy"
                  >
                    <CopyOutlined />
                  </button>
                </div>
              </div>

              <div style={{ background: 'rgba(242,140,56,0.08)', border: '1px solid rgba(242,140,56,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <p style={{ color: '#888', fontSize: '10px', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px' }}>COUPON CODE</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <span style={{ color: '#F28C38', fontSize: '20px', fontWeight: 900, letterSpacing: '2px' }}>{createdPartner.code}</span>
                  <button
                    style={{ background: 'none', border: '1px solid #444', borderRadius: '8px', color: '#aaa', padding: '6px 10px', cursor: 'pointer', fontSize: '13px' }}
                    onClick={() => { navigator.clipboard.writeText(createdPartner.code); toast.success('Coupon code copied!') }}
                    title="Copy"
                  >
                    <CopyOutlined />
                  </button>
                </div>
              </div>

              <p style={{ color: '#666', fontSize: '11px', lineHeight: '1.5' }}>
                Share this QR & referral code with <strong style={{ color: '#fff' }}>{createdPartner.name}</strong>. When a user registers using this referral, it will be tracked under this partner.
              </p>

              <button
                className="adm-add-btn"
                style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
                onClick={() => {
                  const qrUrl = generateQRCodeUrl(`${window.location.origin}/?ref=${createdPartner.referralCode}`, 600)
                  window.open(qrUrl, '_blank')
                }}
              >
                <DownloadOutlined /> Download QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="adm-table-wrap adm-desktop-only">
        <table className="adm-table adm-table-fixed">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Referral</th>
              <th>Sales</th>
              <th>Revenue</th>
              <th>Commission %</th>
              <th>Pending ₹</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.key} className={p.status !== 'active' ? 'adm-row-suspended' : ''}>
                <td className="adm-td-name">{p.name}</td>
                <td className="adm-td-vehicle">{p.code}</td>
                <td className="adm-td-id">{p.referralCode || '—'}</td>
                <td>{p.totalSales || 0}</td>
                <td>₹{(p.totalRevenue || 0).toLocaleString()}</td>
                <td>{p.comm || 0}%</td>
                <td style={{ color: (p.pendingComm || 0) > 0 ? 'var(--accent)' : 'var(--text-dim)' }}>₹{(p.pendingComm || 0).toLocaleString()}</td>
                <td><Tag color={p.status === 'active' ? 'green' : 'red'}>{p.status}</Tag></td>
                <td>
                  <div className="adm-actions">
                    <button className={`adm-btn-sm ${p.status === 'active' ? 'adm-btn-red' : 'adm-btn-green'}`} onClick={() => toggleStatus(p)} title={p.status === 'active' ? 'Deactivate' : 'Activate'}>
                      {p.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                    </button>
                    {(p.pendingComm || 0) > 0 && (
                      <button className="adm-btn-sm adm-btn-green" onClick={() => markPaid(p)} title="Mark as Paid">
                        <DollarOutlined />
                      </button>
                    )}
                    {p.referralCode && (
                      <button className="adm-btn-sm" onClick={() => setCreatedPartner(p)} title="View QR & Referral">
                        <QrcodeOutlined />
                      </button>
                    )}
                    <button className="adm-btn-sm" onClick={() => viewPartnerCustomers(p)} title="View Customers">👥</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="adm-card-list adm-mobile-only">
        {partners.map((p) => (
          <div key={p.key} className={`adm-card ${p.status !== 'active' ? 'adm-card-suspended' : ''}`}>
            <div className="adm-card-row adm-card-row-between">
              <span className="adm-card-name">{p.name}</span>
              <Tag color={p.status === 'active' ? 'green' : 'red'}>{p.status}</Tag>
            </div>
            <div className="adm-card-row">
              <span className="adm-card-vehicle">{p.code}</span>
            </div>

            {/* Stats Row */}
            <div className="adm-partner-stats">
              <div className="adm-partner-stat">
                <span className="adm-partner-stat-value">{p.totalSales || 0}</span>
                <span className="adm-partner-stat-label">Sales</span>
              </div>
              <div className="adm-partner-stat">
                <span className="adm-partner-stat-value">₹{(p.totalRevenue || 0).toLocaleString()}</span>
                <span className="adm-partner-stat-label">Revenue</span>
              </div>
              <div className="adm-partner-stat">
                <span className="adm-partner-stat-value">{p.comm || 0}%</span>
                <span className="adm-partner-stat-label">Comm</span>
              </div>
              <div className="adm-partner-stat">
                <span className="adm-partner-stat-value" style={{ color: (p.pendingComm || 0) > 0 ? 'var(--accent)' : 'var(--text-dim)' }}>
                  ₹{(p.pendingComm || 0).toLocaleString()}
                </span>
                <span className="adm-partner-stat-label">Pending</span>
              </div>
            </div>

            {/* Actions */}
            <div className="adm-card-actions">
              <button
                className={`adm-action-btn ${p.status === 'active' ? 'adm-action-red' : 'adm-action-green'}`}
                onClick={() => toggleStatus(p)}
              >
                {p.status === 'active' ? <><StopOutlined /> Deactivate</> : <><CheckCircleOutlined /> Activate</>}
              </button>
              {(p.pendingComm || 0) > 0 && (
                <button className="adm-action-btn adm-action-green" onClick={() => markPaid(p)}>
                  <DollarOutlined /> Mark Paid
                </button>
              )}
            </div>
          </div>
        ))}
        {partners.length === 0 && <p className="adm-empty">No partners yet</p>}
      </div>

      {/* Partner Customers Modal */}
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
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No customers found for this coupon code</p>
              ) : (
                <>
                  <p style={{ color: '#888', fontSize: '12px', marginBottom: '14px' }}>{partnerCustomers.length} customers acquired</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                    {partnerCustomers.map((c) => (
                      <div key={c.key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ color: '#fff', fontWeight: 900, fontSize: '14px' }}>{c.name}</span>
                          <Tag color={c.status === 'Suspended' ? 'red' : 'green'}>{c.status}</Tag>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#F28C38', fontWeight: 900, fontSize: '13px' }}>{c.vehicle}</span>
                          <span style={{ color: '#888', fontSize: '12px' }}>{c.mobile}</span>
                          <span style={{ color: '#666', fontSize: '11px' }}>{c.plan}</span>
                          <span style={{ color: '#666', fontSize: '11px' }}>₹{c.amount}</span>
                          <span style={{ color: '#555', fontSize: '10px' }}>{c.timestamp ? new Date(c.timestamp).toLocaleDateString('en-IN') : ''}</span>
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
