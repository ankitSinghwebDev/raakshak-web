import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  PlusOutlined, CloseOutlined, DownloadOutlined,
  CheckCircleOutlined, StopOutlined, DollarOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { Tag } from 'antd'
import { db, ref, get, push, set, update } from '../../config/firebase'

const PartnerManagement = () => {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newPartner, setNewPartner] = useState({ name: '', code: '', comm: '' })
  const [exporting, setExporting] = useState(false)

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
    try {
      const partnerRef = push(ref(db, 'partners'))
      await set(partnerRef, {
        name: newPartner.name,
        code: newPartner.code.toUpperCase(),
        comm: parseFloat(newPartner.comm) || 0,
        totalSales: 0,
        totalRevenue: 0,
        pendingComm: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      })
      toast.success('Partner added!')
      setShowAdd(false)
      setNewPartner({ name: '', code: '', comm: '' })
      const snap = await get(ref(db, 'partners'))
      if (snap.exists()) setPartners(Object.entries(snap.val()).map(([key, val]) => ({ key, ...val })))
    } catch {
      toast.error('Failed to add partner')
    }
  }

  const toggleStatus = async (partner) => {
    const newStatus = partner.status === 'active' ? 'inactive' : 'active'
    try {
      await update(ref(db, `partners/${partner.key}`), { status: newStatus })
      setPartners((prev) => prev.map((p) => p.key === partner.key ? { ...p, status: newStatus } : p))
      toast.success(`${partner.name} ${newStatus}`)
    } catch {
      toast.error('Failed')
    }
  }

  const markPaid = async (partner) => {
    try {
      await update(ref(db, `partners/${partner.key}`), { pendingComm: 0, lastPaidAt: new Date().toISOString() })
      setPartners((prev) => prev.map((p) => p.key === partner.key ? { ...p, pendingComm: 0 } : p))
      toast.success(`Commission paid for ${partner.name}`)
    } catch {
      toast.error('Failed')
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

  if (loading) return <div className="adm-loading"><LoadingOutlined /> Loading partners...</div>

  return (
    <div>
      <div className="adm-toolbar">
        <span className="adm-result-count">{partners.length} partners</span>
        <button className="adm-icon-btn adm-icon-export" onClick={handleExportPartners} disabled={exporting} title="Download Excel">
          <DownloadOutlined />
        </button>
        <button className="adm-add-btn" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <><CloseOutlined /> Cancel</> : <><PlusOutlined /> Add Partner</>}
        </button>
      </div>

      {/* Add Partner Form */}
      {showAdd && (
        <form className="adm-add-form" onSubmit={handleAddPartner}>
          <input placeholder="Partner Name" value={newPartner.name} onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })} required />
          <input placeholder="Coupon Code" value={newPartner.code} onChange={(e) => setNewPartner({ ...newPartner, code: e.target.value })} required />
          <input placeholder="Commission %" type="number" value={newPartner.comm} onChange={(e) => setNewPartner({ ...newPartner, comm: e.target.value })} />
          <button type="submit"><PlusOutlined /> Add Partner</button>
        </form>
      )}

      {/* Desktop Table */}
      <div className="adm-table-wrap adm-desktop-only">
        <table className="adm-table adm-table-fixed">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
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
    </div>
  )
}

export default PartnerManagement
