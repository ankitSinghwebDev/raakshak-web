import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  DownloadOutlined, EyeOutlined, CloseOutlined,
  CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons'
import { Tag } from 'antd'
import { db, ref, get, update } from '../../config/firebase'
import { ListSkeleton } from './AdminSkeleton'

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await get(ref(db, 'customers'))
        if (snap.exists()) {
          const data = snap.val()
          const list = Object.entries(data)
            .map(([key, val]) => ({ key, ...val }))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          setCustomers(list)
          setFiltered(list)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    let result = customers
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) =>
        c.name?.toLowerCase().includes(q) ||
        c.vehicle?.toLowerCase().includes(q) ||
        c.mobile?.includes(q) ||
        c.generatedId?.toLowerCase().includes(q)
      )
    }
    if (filterPlan !== 'all') {
      result = result.filter((c) => c.plan === filterPlan)
    }
    setFiltered(result)
  }, [search, filterPlan, customers])

  const handleSuspend = async (customer) => {
    const newStatus = customer.status === 'Suspended' ? 'Paid' : 'Suspended'
    try {
      await update(ref(db, `customers/${customer.key}`), { status: newStatus })
      setCustomers((prev) => prev.map((c) => c.key === customer.key ? { ...c, status: newStatus } : c))
      toast.success(`${customer.vehicle} ${newStatus === 'Suspended' ? 'suspended' : 'reactivated'}`)
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleExportCustomers = async () => {
    setExporting(true)
    try {
      const rows = filtered.map((c) => ({
        'Name': c.name || '—',
        'Vehicle': c.vehicle || '—',
        'Mobile': c.mobile || '—',
        'WhatsApp': c.whatsapp || c.mobile || '—',
        'Rakshak ID': c.generatedId || '—',
        'Plan': c.plan || '—',
        'Status': c.status || 'Paid',
        'Amount (₹)': parseInt(c.amount) || 0,
        'Payment ID': c.paymentId || '—',
        'Coupon': c.coupon || '—',
        'Total Scans': c.totalScans || 0,
        'Emergency Contact': c.emergency?.iceContact1 || '—',
        'Blood Group': c.emergency?.bloodGroup || '—',
        'Registered': c.timestamp ? new Date(c.timestamp).toLocaleString('en-IN') : '—',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length + 2, 14) }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Customers')
      XLSX.writeFile(wb, `Rakshak_Customers_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Customers exported!')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <ListSkeleton />

  return (
    <div>
      {/* Search & Filter */}
      <div className="adm-toolbar">
        <input
          className="adm-search"
          placeholder="Search name, vehicle, mobile, ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="adm-filter-select" value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
          <option value="all">All Plans</option>
          <option value="Lite Plan">Lite Plan</option>
          <option value="Premium Studio">Premium Studio</option>
          <option value="Custom QR">Custom QR</option>
        </select>
        <span className="adm-result-count">{filtered.length} customers</span>
        <button className="adm-icon-btn adm-icon-export" onClick={handleExportCustomers} disabled={exporting} title="Download Excel">
          <DownloadOutlined />
        </button>
      </div>

      {/* Desktop Table */}
      <div className="adm-table-wrap adm-desktop-only">
        <table className="adm-table adm-table-fixed">
          <thead>
            <tr>
              <th>Name</th>
              <th>Vehicle</th>
              <th>Mobile</th>
              <th>Rakshak ID</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Coupon</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.key} className={c.status === 'Suspended' ? 'adm-row-suspended' : ''}>
                <td className="adm-td-name">{c.name}</td>
                <td className="adm-td-vehicle">{c.vehicle}</td>
                <td>{c.mobile}</td>
                <td className="adm-td-id">{c.generatedId}</td>
                <td><Tag color={c.plan === 'Lite Plan' ? 'default' : 'orange'}>{c.plan}</Tag></td>
                <td><Tag color={c.status === 'Suspended' ? 'red' : 'green'}>{c.status}</Tag></td>
                <td>₹{c.amount}</td>
                <td>{c.coupon || '—'}</td>
                <td className="adm-td-date">{c.timestamp ? new Date(c.timestamp).toLocaleDateString('en-IN') : '—'}</td>
                <td>
                  <div className="adm-actions">
                    <button className="adm-btn-sm" onClick={() => setSelected(selected?.key === c.key ? null : c)}>
                      {selected?.key === c.key ? <CloseOutlined /> : <EyeOutlined />}
                    </button>
                    <button className={`adm-btn-sm ${c.status === 'Suspended' ? 'adm-btn-green' : 'adm-btn-red'}`} onClick={() => handleSuspend(c)}>
                      {c.status === 'Suspended' ? <CheckCircleOutlined /> : <StopOutlined />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Desktop Detail Panel */}
      {selected && (
        <div className="adm-detail-panel adm-desktop-only">
          <h4>{selected.name} — {selected.vehicle}</h4>
          <div className="adm-detail-grid">
            <div><span>Rakshak ID</span><strong>{selected.generatedId}</strong></div>
            <div><span>Mobile</span><strong>{selected.mobile}</strong></div>
            <div><span>WhatsApp</span><strong>{selected.whatsapp || selected.mobile}</strong></div>
            <div><span>Plan</span><strong>{selected.plan}</strong></div>
            <div><span>Payment ID</span><strong style={{ fontSize: '11px' }}>{selected.paymentId || '—'}</strong></div>
            <div><span>Coupon</span><strong>{selected.coupon || '—'}</strong></div>
            <div><span>Status</span><strong style={{ color: selected.status === 'Suspended' ? 'var(--red)' : 'var(--green)' }}>{selected.status}</strong></div>
            <div><span>Total Scans</span><strong>{selected.totalScans || 0}</strong></div>
            <div><span>Emergency Contact</span><strong>{selected.emergency?.iceContact1 || 'Not set'}</strong></div>
            <div><span>Blood Group</span><strong>{selected.emergency?.bloodGroup || 'Not set'}</strong></div>
            <div><span>QR Link</span><strong style={{ fontSize: '10px', wordBreak: 'break-all' }}>{selected.qrLink || '—'}</strong></div>
            <div><span>Registered</span><strong>{selected.timestamp ? new Date(selected.timestamp).toLocaleString('en-IN') : '—'}</strong></div>
          </div>
        </div>
      )}

      {/* Mobile Cards */}
      <div className="adm-card-list adm-mobile-only">
        {filtered.map((c) => (
          <div
            key={c.key}
            className={`adm-card adm-card-tap ${c.status === 'Suspended' ? 'adm-card-suspended' : ''} ${selected?.key === c.key ? 'adm-card-selected' : ''}`}
            onClick={() => setSelected(selected?.key === c.key ? null : c)}
          >
            <div className="adm-card-row adm-card-row-between">
              <span className="adm-card-name">{c.name}</span>
              <Tag color={c.status === 'Suspended' ? 'red' : 'green'}>
                {c.status === 'Suspended' ? 'Suspended' : 'Active'}
              </Tag>
            </div>
            <div className="adm-card-row adm-card-row-between">
              <span className="adm-card-vehicle">{c.vehicle}</span>
              <Tag color={c.plan === 'Lite Plan' ? 'default' : 'orange'}>
                {c.plan === 'Lite Plan' ? 'LITE' : 'PRO'}
              </Tag>
            </div>
            <div className="adm-card-row adm-card-row-between adm-card-meta">
              <span>{c.mobile}</span>
              <span>₹{c.amount}</span>
              <span>{c.timestamp ? new Date(c.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
            </div>

            {/* Expanded Detail */}
            {selected?.key === c.key && (
              <div className="adm-card-detail">
                <div className="adm-card-detail-grid">
                  <div><span>Rakshak ID</span><strong>{c.generatedId}</strong></div>
                  <div><span>WhatsApp</span><strong>{c.whatsapp || c.mobile}</strong></div>
                  <div><span>Payment ID</span><strong>{c.paymentId || '—'}</strong></div>
                  <div><span>Coupon</span><strong>{c.coupon || '—'}</strong></div>
                  <div><span>Total Scans</span><strong>{c.totalScans || 0}</strong></div>
                  <div><span>Emergency</span><strong>{c.emergency?.iceContact1 || 'Not set'}</strong></div>
                  <div><span>Blood Group</span><strong>{c.emergency?.bloodGroup || 'Not set'}</strong></div>
                  <div><span>Registered</span><strong>{c.timestamp ? new Date(c.timestamp).toLocaleString('en-IN') : '—'}</strong></div>
                </div>
                <div className="adm-card-actions">
                  <button
                    className={`adm-action-btn ${c.status === 'Suspended' ? 'adm-action-green' : 'adm-action-red'}`}
                    onClick={(e) => { e.stopPropagation(); handleSuspend(c) }}
                  >
                    {c.status === 'Suspended' ? <><CheckCircleOutlined /> Reactivate</> : <><StopOutlined /> Suspend</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="adm-empty">No customers found</p>}
      </div>
    </div>
  )
}

export default CustomerManagement
