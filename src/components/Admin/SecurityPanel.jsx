import { useState, useEffect, useMemo } from 'react'
import { Card, Row, Col, Tag, Table, Typography, Space, Empty } from 'antd'
import {
  SafetyOutlined, WarningOutlined, UserOutlined,
  LockOutlined, AlertOutlined,
} from '@ant-design/icons'
import { db, ref, get } from '../../config/firebase'
import { DashboardSkeleton } from './AdminSkeleton'

const { Text } = Typography

const SecurityPanel = () => {
  const [admins, setAdmins] = useState([])
  const [scans, setScans] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [adminSnap, scanSnap, custSnap] = await Promise.all([
          get(ref(db, 'admins')),
          get(ref(db, 'scans')),
          get(ref(db, 'customers')),
        ])
        if (adminSnap.exists()) setAdmins(Object.entries(adminSnap.val()).map(([k, v]) => ({ key: k, ...v })))
        if (custSnap.exists()) {
          const custs = Object.entries(custSnap.val()).map(([k, v]) => ({ key: k, ...v }))
          setCustomers(custs)
          if (scanSnap.exists()) {
            const allScans = []
            Object.entries(scanSnap.val()).forEach(([custKey, userScans]) => {
              const cust = custs.find((c) => c.key === custKey)
              Object.entries(userScans).forEach(([scanKey, scan]) => {
                allScans.push({ id: scanKey, vehicle: cust?.vehicle || '—', owner: cust?.name || '—', ...scan })
              })
            })
            setScans(allScans)
          }
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const data = useMemo(() => {
    // Admin security
    const suspendedAdmins = admins.filter((a) => a.status === 'suspended')
    const superAdmins = admins.filter((a) => a.role === 'Super Admin')

    // Emergency scans (high priority)
    const emergencyScans = scans
      .filter((s) => s.type === 'emergency')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)

    // Suspicious activity — devices with most scans
    const deviceMap = {}
    scans.forEach((s) => {
      const fp = s.deviceFingerprint || 'unknown'
      deviceMap[fp] = (deviceMap[fp] || { count: 0, vehicles: new Set(), lastScan: '' })
      deviceMap[fp].count++
      deviceMap[fp].vehicles.add(s.vehicle)
      if (s.timestamp > deviceMap[fp].lastScan) deviceMap[fp].lastScan = s.timestamp
    })
    const suspiciousDevices = Object.entries(deviceMap)
      .map(([fp, d]) => ({ fingerprint: fp, count: d.count, vehicles: d.vehicles.size, lastScan: d.lastScan }))
      .filter((d) => d.count > 5 || d.vehicles > 3)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Suspended customers
    const suspendedCustomers = customers.filter((c) => c.status === 'Suspended')

    return { suspendedAdmins, superAdmins, emergencyScans, suspiciousDevices, suspendedCustomers }
  }, [admins, scans, customers])

  if (loading) return <DashboardSkeleton />

  return (
    <div className="adm-dashboard">
      {/* Security KPIs */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" className="adm-kpi-card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>{admins.length}</div>
              <Text style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Total Admins</Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="adm-kpi-card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)' }}>{data.superAdmins.length}</div>
              <Text style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Super Admins</Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="adm-kpi-card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: data.suspendedAdmins.length > 0 ? 'var(--red)' : 'var(--green)' }}>{data.suspendedAdmins.length}</div>
              <Text style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Suspended Admins</Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="adm-kpi-card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: data.suspiciousDevices.length > 0 ? 'var(--red)' : 'var(--green)' }}>{data.suspiciousDevices.length}</div>
              <Text style={{ color: 'var(--text-dim)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Suspicious Devices</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Admin Accounts */}
        <Col xs={24} md={12}>
          <Card title={<><UserOutlined /> Admin Accounts</>} size="small" className="adm-chart-card">
            {admins.length === 0 ? <Empty description="No admins" /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {admins.map((a) => (
                  <div key={a.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>{a.name}</Text>
                      <Text style={{ color: 'var(--text-dim)', fontSize: 11 }}>{a.empId}</Text>
                    </div>
                    <Space size={4}>
                      <Tag color={a.role === 'Super Admin' ? 'gold' : 'blue'}>{a.role}</Tag>
                      <Tag color={a.status === 'suspended' ? 'red' : 'green'}>{a.status === 'suspended' ? 'Suspended' : 'Active'}</Tag>
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* Emergency Alerts */}
        <Col xs={24} md={12}>
          <Card title={<><AlertOutlined style={{ color: 'var(--red)' }} /> Emergency Scan Alerts</>} size="small" className="adm-chart-card">
            {data.emergencyScans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <SafetyOutlined style={{ fontSize: 32, color: 'var(--green)', marginBottom: 8 }} />
                <br />
                <Text style={{ color: 'var(--green)' }}>No emergency scans recorded</Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.emergencyScans.map((s) => (
                  <div key={s.id} style={{ padding: '8px 10px', background: 'var(--red-bg)', borderRadius: 8, border: '1px solid var(--red-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text strong style={{ color: 'var(--red)' }}>{s.vehicle}</Text>
                      <Text style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                        {s.timestamp ? new Date(s.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </Text>
                    </div>
                    <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.message || 'Emergency triggered'}</Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Suspicious Devices */}
      <Card title={<><WarningOutlined style={{ color: 'var(--accent)' }} /> Suspicious Activity (High Scan Devices)</>} size="small" className="adm-chart-card" style={{ marginBottom: 16 }}>
        {data.suspiciousDevices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <SafetyOutlined style={{ fontSize: 32, color: 'var(--green)', marginBottom: 8 }} />
            <br />
            <Text style={{ color: 'var(--green)' }}>No suspicious activity detected</Text>
          </div>
        ) : (
          <>
            <div className="adm-desktop-only">
              <Table dataSource={data.suspiciousDevices} rowKey="fingerprint" pagination={false} size="small" columns={[
                { title: 'Device Fingerprint', dataIndex: 'fingerprint', render: (v) => <Text style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{v.slice(0, 20)}</Text> },
                { title: 'Total Scans', dataIndex: 'count', render: (v) => <Tag color={v > 10 ? 'red' : 'orange'}>{v}</Tag> },
                { title: 'Unique Vehicles', dataIndex: 'vehicles', render: (v) => <Tag color={v > 3 ? 'red' : 'default'}>{v}</Tag> },
                { title: 'Last Scan', dataIndex: 'lastScan', render: (v) => v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—' },
              ]} />
            </div>
            <div className="adm-mobile-only">
              {data.suspiciousDevices.map((d) => (
                <div key={d.fingerprint} className="adm-card" style={{ marginBottom: 8 }}>
                  <div className="adm-card-row adm-card-row-between">
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{d.fingerprint.slice(0, 16)}</span>
                    <Tag color="red">{d.count} scans</Tag>
                  </div>
                  <div className="adm-card-row adm-card-row-between adm-card-meta">
                    <span>{d.vehicles} vehicles</span>
                    <span>{d.lastScan ? new Date(d.lastScan).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Suspended Customers */}
      {data.suspendedCustomers.length > 0 && (
        <Card title={<><LockOutlined /> Suspended Customers ({data.suspendedCustomers.length})</>} size="small" className="adm-chart-card">
          <Space wrap size={[8, 8]}>
            {data.suspendedCustomers.map((c) => (
              <Tag key={c.key} color="red">{c.name} — {c.vehicle}</Tag>
            ))}
          </Space>
        </Card>
      )}
    </div>
  )
}

export default SecurityPanel
