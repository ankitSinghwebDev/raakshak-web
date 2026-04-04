import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Card, Row, Col, Tag, Switch, Typography, Space, InputNumber } from 'antd'
import {
  ControlOutlined, SafetyOutlined, ClockCircleOutlined,
  SaveOutlined, SettingOutlined, StopOutlined,
} from '@ant-design/icons'
import { db, ref, get, set } from '../../config/firebase'
<<<<<<< HEAD
import { logAdminAction, ACTIONS } from '../../utils/auditLog'
=======
>>>>>>> main
import { SettingsSkeleton } from './AdminSkeleton'

const { Text } = Typography

const DEFAULT_CONFIG = {
  maintenanceMode: false,
  registrationEnabled: true,
  scannerEnabled: true,
  pushNotificationsEnabled: true,
  maxScansPerHour: 3,
  maxScansPerDay: 10,
  sessionTimeoutMinutes: 15,
  minPasswordLength: 6,
}

const ControlPanel = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await get(ref(db, 'config'))
        if (snap.exists()) {
          setConfig({ ...DEFAULT_CONFIG, ...snap.val() })
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await set(ref(db, 'config'), config)
<<<<<<< HEAD
      await logAdminAction(ACTIONS.CONFIG_UPDATED, 'config', 'System Config', config)
=======
>>>>>>> main
      toast.success('Configuration saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) return <SettingsSkeleton />

  return (
    <div className="adm-dashboard">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="adm-export-btn" onClick={handleSave} disabled={saving} style={{ width: 'auto', background: 'linear-gradient(135deg, var(--accent), #ff8c00)' }}>
          {saving ? <><LoadingOutlined /> Saving...</> : <><SaveOutlined /> Save Changes</>}
        </button>
      </div>

      <Row gutter={[16, 16]}>
        {/* System Controls */}
        <Col xs={24} md={12}>
          <Card title={<><ControlOutlined /> System Controls</>} size="small" className="adm-chart-card">
<<<<<<< HEAD
            <div className="adm-control-list">
              <div className="adm-control-row">
                <div className="adm-control-copy">
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>Maintenance Mode</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>Disables all user access</Text>
                </div>
                <div className="adm-control-toggle-wrap">
                  <span className={`adm-control-state ${config.maintenanceMode ? 'is-on' : 'is-off'}`}>
                    {config.maintenanceMode ? 'ON' : 'OFF'}
                  </span>
                  <Switch
                    className="adm-control-switch"
                    checked={config.maintenanceMode}
                    onChange={(v) => updateConfig('maintenanceMode', v)}
                  />
                </div>
              </div>

              <div className="adm-control-row">
                <div className="adm-control-copy">
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>Registration</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>Allow new customer signups</Text>
                </div>
                <div className="adm-control-toggle-wrap">
                  <span className={`adm-control-state ${config.registrationEnabled ? 'is-on' : 'is-off'}`}>
                    {config.registrationEnabled ? 'ON' : 'OFF'}
                  </span>
                  <Switch
                    className="adm-control-switch"
                    checked={config.registrationEnabled}
                    onChange={(v) => updateConfig('registrationEnabled', v)}
                  />
                </div>
              </div>

              <div className="adm-control-row">
                <div className="adm-control-copy">
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>QR Scanner</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>Allow public scan page</Text>
                </div>
                <div className="adm-control-toggle-wrap">
                  <span className={`adm-control-state ${config.scannerEnabled ? 'is-on' : 'is-off'}`}>
                    {config.scannerEnabled ? 'ON' : 'OFF'}
                  </span>
                  <Switch
                    className="adm-control-switch"
                    checked={config.scannerEnabled}
                    onChange={(v) => updateConfig('scannerEnabled', v)}
                  />
                </div>
              </div>

              <div className="adm-control-row">
                <div className="adm-control-copy">
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>Push Notifications</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>FCM notifications to owners</Text>
                </div>
                <div className="adm-control-toggle-wrap">
                  <span className={`adm-control-state ${config.pushNotificationsEnabled ? 'is-on' : 'is-off'}`}>
                    {config.pushNotificationsEnabled ? 'ON' : 'OFF'}
                  </span>
                  <Switch
                    className="adm-control-switch"
                    checked={config.pushNotificationsEnabled}
                    onChange={(v) => updateConfig('pushNotificationsEnabled', v)}
                  />
                </div>
=======
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>Maintenance Mode</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>Disables all user access</Text>
                </div>
                <Switch
                  checked={config.maintenanceMode}
                  onChange={(v) => updateConfig('maintenanceMode', v)}
                  checkedChildren="ON" unCheckedChildren="OFF"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>Registration</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>Allow new customer signups</Text>
                </div>
                <Switch
                  checked={config.registrationEnabled}
                  onChange={(v) => updateConfig('registrationEnabled', v)}
                  checkedChildren="ON" unCheckedChildren="OFF"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>QR Scanner</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>Allow public scan page</Text>
                </div>
                <Switch
                  checked={config.scannerEnabled}
                  onChange={(v) => updateConfig('scannerEnabled', v)}
                  checkedChildren="ON" unCheckedChildren="OFF"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>Push Notifications</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>FCM notifications to owners</Text>
                </div>
                <Switch
                  checked={config.pushNotificationsEnabled}
                  onChange={(v) => updateConfig('pushNotificationsEnabled', v)}
                  checkedChildren="ON" unCheckedChildren="OFF"
                />
>>>>>>> main
              </div>
            </div>
          </Card>
        </Col>

        {/* Rate Limits & Security */}
        <Col xs={24} md={12}>
          <Card title={<><SafetyOutlined /> Rate Limits & Security</>} size="small" className="adm-chart-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>Max Scans/Hour</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>Per device rate limit</Text>
                </div>
                <InputNumber
                  min={1} max={50}
                  value={config.maxScansPerHour}
                  onChange={(v) => updateConfig('maxScansPerHour', v)}
                  style={{ width: 80 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>Max Scans/Day</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>Daily limit per device</Text>
                </div>
                <InputNumber
                  min={1} max={200}
                  value={config.maxScansPerDay}
                  onChange={(v) => updateConfig('maxScansPerDay', v)}
                  style={{ width: 80 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>Session Timeout</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>Admin auto-logout (minutes)</Text>
                </div>
                <InputNumber
                  min={5} max={120}
                  value={config.sessionTimeoutMinutes}
                  onChange={(v) => updateConfig('sessionTimeoutMinutes', v)}
                  style={{ width: 80 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ color: 'var(--text-primary)', display: 'block' }}>Min Password Length</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>For admin accounts</Text>
                </div>
                <InputNumber
                  min={6} max={32}
                  value={config.minPasswordLength}
                  onChange={(v) => updateConfig('minPasswordLength', v)}
                  style={{ width: 80 }}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Current Status */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title={<><SettingOutlined /> Current Status</>} size="small" className="adm-chart-card">
            <Space wrap size={[8, 8]}>
              <Tag color={config.maintenanceMode ? 'red' : 'green'}>
                {config.maintenanceMode ? <><StopOutlined /> Maintenance Mode ON</> : 'System Live'}
              </Tag>
              <Tag color={config.registrationEnabled ? 'green' : 'red'}>
                Registration {config.registrationEnabled ? 'Open' : 'Closed'}
              </Tag>
              <Tag color={config.scannerEnabled ? 'green' : 'red'}>
                Scanner {config.scannerEnabled ? 'Active' : 'Disabled'}
              </Tag>
              <Tag color={config.pushNotificationsEnabled ? 'green' : 'red'}>
                Push {config.pushNotificationsEnabled ? 'Enabled' : 'Disabled'}
              </Tag>
              <Tag>Scan Limit: {config.maxScansPerHour}/hr · {config.maxScansPerDay}/day</Tag>
              <Tag><ClockCircleOutlined /> Timeout: {config.sessionTimeoutMinutes}m</Tag>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ControlPanel
