import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  DownloadOutlined, WarningOutlined, AlertOutlined,
  CarOutlined, LoadingOutlined,
} from '@ant-design/icons'
import { Tag } from 'antd'
import { db, ref, get } from '../../config/firebase'

const ScanLogs = () => {
  const [scans, setScans] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const scanSnap = await get(ref(db, 'scans'))
        const custSnap = await get(ref(db, 'customers'))
        const customers = custSnap.exists() ? custSnap.val() : {}

        if (scanSnap.exists()) {
          const data = scanSnap.val()
          const allScans = []

          Object.entries(data).forEach(([custKey, userScans]) => {
            const customer = customers[custKey] || {}
            Object.entries(userScans).forEach(([scanKey, scan]) => {
              allScans.push({
                id: scanKey,
                customerKey: custKey,
                vehicle: customer.vehicle || '—',
                ownerName: customer.name || '—',
                ...scan,
              })
            })
          })

          allScans.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          setScans(allScans)
          setFiltered(allScans)
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
    let result = scans
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((s) =>
        s.vehicle?.toLowerCase().includes(q) ||
        s.ownerName?.toLowerCase().includes(q) ||
        s.message?.toLowerCase().includes(q)
      )
    }
    if (filterType !== 'all') {
      result = result.filter((s) => s.type === filterType)
    }
    setFiltered(result)
  }, [search, filterType, scans])

  const handleExportScans = () => {
    setExporting(true)
    try {
      const rows = filtered.map((s) => ({
        'Date & Time': s.timestamp ? new Date(s.timestamp).toLocaleString('en-IN') : '—',
        'Vehicle': s.vehicle || '—',
        'Owner': s.ownerName || '—',
        'Type': (s.type || 'parking').toUpperCase(),
        'Message': s.message || '—',
        'Device': s.deviceFingerprint || '—',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = Object.keys(rows[0] || {}).map((k) => ({ wch: Math.max(k.length + 2, 14) }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Scan Logs')
      XLSX.writeFile(wb, `Rakshak_Scans_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Scans exported!')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <div className="adm-loading"><LoadingOutlined /> Loading scan logs...</div>

  const typeIcon = (type) => {
    if (type === 'emergency') return <AlertOutlined style={{ color: 'var(--red)' }} />
    if (type === 'urgent') return <WarningOutlined style={{ color: 'var(--orange-alert)' }} />
    return <CarOutlined style={{ color: 'var(--accent)' }} />
  }

  const typeColor = (type) => {
    if (type === 'emergency') return 'red'
    if (type === 'urgent') return 'orange'
    return 'gold'
  }

  return (
    <div>
      <div className="adm-toolbar">
        <input className="adm-search" placeholder="Search vehicle, name, message..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="adm-filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="parking">Parking</option>
          <option value="urgent">Urgent</option>
          <option value="emergency">Emergency</option>
        </select>
        <span className="adm-result-count">{filtered.length} scans</span>
        <button className="adm-icon-btn adm-icon-export" onClick={handleExportScans} disabled={exporting} title="Download Excel">
          <DownloadOutlined />
        </button>
      </div>

      {/* Desktop Table */}
      <div className="adm-table-wrap adm-desktop-only">
        <table className="adm-table adm-table-fixed">
          <thead>
            <tr>
              <th>Time</th>
              <th>Vehicle</th>
              <th>Owner</th>
              <th>Message</th>
              <th>Type</th>
              <th>Device</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((s) => (
              <tr key={s.id}>
<<<<<<< HEAD
                <td className="adm-td-date" title={s.timestamp ? new Date(s.timestamp).toLocaleString('en-IN') : '—'}>{s.timestamp ? new Date(s.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className="adm-td-vehicle" title={s.vehicle}>{s.vehicle}</td>
                <td className="adm-td-name" title={s.ownerName}>{s.ownerName}</td>
                <td title={s.message || '—'}>{s.message || '—'}</td>
                <td title={s.type}><Tag color={typeColor(s.type)}>{s.type}</Tag></td>
                <td className="adm-td-device" title={s.deviceFingerprint || '—'}>{s.deviceFingerprint?.slice(0, 12) || '—'}</td>
=======
                <td className="adm-td-date">{s.timestamp ? new Date(s.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className="adm-td-vehicle">{s.vehicle}</td>
                <td className="adm-td-name">{s.ownerName}</td>
                <td>{s.message || '—'}</td>
                <td><Tag color={typeColor(s.type)}>{s.type}</Tag></td>
                <td className="adm-td-device">{s.deviceFingerprint?.slice(0, 12) || '—'}</td>
>>>>>>> main
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="adm-card-list adm-mobile-only">
        {filtered.slice(0, 100).map((s) => (
          <div key={s.id} className="adm-card">
            <div className="adm-card-row adm-card-row-between">
              <div className="adm-scan-header">
                <span className="adm-scan-type-icon">{typeIcon(s.type)}</span>
                <div>
                  <span className="adm-card-vehicle">{s.vehicle}</span>
                  <span className="adm-scan-owner">{s.ownerName}</span>
                </div>
              </div>
              <Tag color={typeColor(s.type)}>{s.type}</Tag>
            </div>
            {s.message && (
              <div className="adm-scan-message">{s.message}</div>
            )}
            <div className="adm-card-row adm-card-row-between adm-card-meta">
              <span>{s.timestamp ? new Date(s.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
              <span className="adm-scan-device">{s.deviceFingerprint?.slice(0, 12) || '—'}</span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length > 100 && <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '16px', fontSize: '12px' }}>Showing first 100 of {filtered.length} scans</p>}
      {filtered.length === 0 && <p className="adm-empty">No scans found</p>}
    </div>
  )
}

export default ScanLogs
