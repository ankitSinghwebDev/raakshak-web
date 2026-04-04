import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  PlusOutlined, CloseOutlined, DeleteOutlined,
  CrownOutlined, LockOutlined, IdcardOutlined,
  StopOutlined, CheckCircleOutlined, ReloadOutlined,
} from '@ant-design/icons'
import { Tag } from 'antd'
import { db, ref, get, push, set, update } from '../../config/firebase'
import { hashPassword } from '../../utils/hashPassword'
<<<<<<< HEAD
import PasswordInput from '../ui/PasswordInput'
=======
>>>>>>> main
import { ListSkeleton } from './AdminSkeleton'

const ROLE_HIERARCHY = { 'Super Admin': 4, 'Admin': 3, 'Support': 2, 'Viewer': 1 }

const AdminManagement = ({ currentAdmin }) => {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
<<<<<<< HEAD
  const [newAdmin, setNewAdmin] = useState({ name: '', empId: '', email: '', password: '', role: 'Admin' })
=======
  const [newAdmin, setNewAdmin] = useState({ name: '', empId: '', password: '', role: 'Admin' })
>>>>>>> main

  const isSuperAdmin = currentAdmin?.role === 'Super Admin'

  const generateEmpId = (name) => {
    const first = (name || 'admin').trim().split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')
    const rand = Math.floor(1000 + Math.random() * 9000)
    return `RKS-${first}${rand}`
  }

  const fetchAdmins = async () => {
    try {
      const snap = await get(ref(db, 'admins'))
      if (snap.exists()) {
        const data = snap.val()
        const list = Object.entries(data).map(([key, val]) => ({ key, ...val }))
        // Sort: Super Admins first, then by name
        list.sort((a, b) => {
          const rA = ROLE_HIERARCHY[a.role] || 0
          const rB = ROLE_HIERARCHY[b.role] || 0
          if (rA !== rB) return rB - rA
          return (a.name || '').localeCompare(b.name || '')
        })
        setAdmins(list)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAdmins() }, [])

  // Can current admin manage the target admin?
  const canManage = (targetAdmin) => {
    if (targetAdmin.key === currentAdmin?.key) return false
    if (!isSuperAdmin) return false
    if (targetAdmin.role === 'Super Admin') return false
    return true
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    if (!newAdmin.name || !newAdmin.empId || !newAdmin.password) {
      toast.error('Fill all required fields')
      return
    }
    if (newAdmin.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    const duplicate = admins.find((a) => a.empId?.toLowerCase() === newAdmin.empId.toLowerCase())
    if (duplicate) {
      toast.error('Employee ID already exists — click refresh to regenerate')
      return
    }

    try {
      const hashedPwd = await hashPassword(newAdmin.password)
      const adminRef = push(ref(db, 'admins'))
      await set(adminRef, {
        name: newAdmin.name.trim(),
        empId: newAdmin.empId.trim(),
<<<<<<< HEAD
        email: newAdmin.email.trim().toLowerCase(),
=======
>>>>>>> main
        password: hashedPwd,
        role: newAdmin.role,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: currentAdmin?.name || 'Unknown',
      })
      toast.success(`Admin "${newAdmin.name}" created!`)
      setShowAdd(false)
<<<<<<< HEAD
      setNewAdmin({ name: '', empId: '', email: '', password: '', role: 'Admin' })
=======
      setNewAdmin({ name: '', empId: '', password: '', role: 'Admin' })
>>>>>>> main
      fetchAdmins()
    } catch {
      toast.error('Failed to create admin')
    }
  }

  const handleSuspend = async (admin) => {
    if (!canManage(admin)) {
      toast.error('You cannot suspend this admin')
      return
    }
    const newStatus = admin.status === 'suspended' ? 'active' : 'suspended'
    try {
      await update(ref(db, `admins/${admin.key}`), { status: newStatus, suspendedBy: newStatus === 'suspended' ? currentAdmin?.name : null })
      setAdmins((prev) => prev.map((a) => a.key === admin.key ? { ...a, status: newStatus } : a))
      toast.success(`${admin.name} ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`)
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async (admin) => {
    if (!canManage(admin)) {
      toast.error('You cannot delete this admin')
      return
    }
    if (!window.confirm(`Delete admin "${admin.name}" (${admin.empId})? This cannot be undone.`)) return
    try {
      await set(ref(db, `admins/${admin.key}`), null)
      toast.success(`Admin "${admin.name}" deleted`)
      setAdmins((prev) => prev.filter((a) => a.key !== admin.key))
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleRoleChange = async (admin, newRole) => {
    if (!canManage(admin)) {
      toast.error('You cannot change this admin\'s role')
      return
    }
    try {
      await update(ref(db, `admins/${admin.key}`), { role: newRole })
      setAdmins((prev) => prev.map((a) => a.key === admin.key ? { ...a, role: newRole } : a))
      toast.success(`${admin.name} is now ${newRole}`)
    } catch {
      toast.error('Failed to update role')
    }
  }

  const roleTagColor = (role) => {
    if (role === 'Super Admin') return 'gold'
    if (role === 'Admin') return 'green'
    if (role === 'Support') return 'blue'
    return 'default'
  }

  if (loading) return <ListSkeleton />

  if (!isSuperAdmin) {
    return <div className="adm-empty">Only Super Admins can access this page.</div>
  }

  return (
    <div>
      <div className="adm-toolbar">
        <span className="adm-result-count">{admins.length} admins</span>
        <button className="adm-add-btn" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <><CloseOutlined /> Cancel</> : <><PlusOutlined /> Add Admin</>}
        </button>
      </div>

      {/* Add Admin Modal */}
      {showAdd && (
        <div className="adm-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h4 className="adm-modal-title"><PlusOutlined /> Create New Admin</h4>
              <button className="adm-modal-close" onClick={() => setShowAdd(false)}><CloseOutlined /></button>
            </div>
            <form className="adm-modal-body" onSubmit={handleAddAdmin}>
              <div className="adm-form-field">
                <label className="adm-form-label">Full Name</label>
                <input
                  className="adm-form-input"
                  placeholder="Enter full name"
                  value={newAdmin.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setNewAdmin({ ...newAdmin, name, empId: generateEmpId(name) })
                  }}
                  required
                />
              </div>
              <div className="adm-form-field">
                <label className="adm-form-label">Employee ID <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(auto-generated)</span></label>
                <div className="adm-form-row">
                  <input
                    className="adm-form-input adm-form-readonly"
                    value={newAdmin.empId}
                    readOnly
                  />
                  <button
                    type="button"
                    className="adm-form-icon-btn"
                    onClick={() => setNewAdmin({ ...newAdmin, empId: generateEmpId(newAdmin.name) })}
                    title="Regenerate ID"
                  >
                    <ReloadOutlined />
                  </button>
                </div>
              </div>
              <div className="adm-form-field">
<<<<<<< HEAD
                <label className="adm-form-label">Email (for password recovery)</label>
                <input
                  className="adm-form-input"
                  type="email"
                  placeholder="admin@company.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  required
                />
              </div>
              <div className="adm-form-field">
                <label className="adm-form-label">Password</label>
                <PasswordInput
                  className="adm-form-input"
                  placeholder="Min 6 characters"
=======
                <label className="adm-form-label">Password</label>
                <input
                  className="adm-form-input"
                  placeholder="Min 6 characters"
                  type="password"
>>>>>>> main
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  required
                />
              </div>
              <div className="adm-form-field">
                <label className="adm-form-label">Role</label>
                <select
                  className="adm-form-input"
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                >
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Support">Support</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <button type="submit" className="adm-form-submit"><PlusOutlined /> Create Admin</button>
            </form>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="adm-table-wrap adm-desktop-only">
        <table className="adm-table adm-table-fixed">
          <thead>
            <tr>
              <th>Name</th>
              <th>Employee ID</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Created On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.key} className={a.status === 'suspended' ? 'adm-row-suspended' : ''}>
                <td className="adm-td-name">
                  {a.role === 'Super Admin' && <CrownOutlined style={{ color: 'var(--accent)', marginRight: 4 }} />}
                  {a.name}
                  {a.key === currentAdmin?.key && <Tag color="orange" style={{ marginLeft: 6 }}>You</Tag>}
                </td>
                <td className="adm-td-vehicle">{a.empId}</td>
                <td><Tag color={roleTagColor(a.role)}>{a.role}</Tag></td>
                <td>
                  <Tag color={a.status === 'suspended' ? 'red' : 'green'}>
                    {a.status === 'suspended' ? 'Suspended' : 'Active'}
                  </Tag>
                </td>
                <td className="adm-td-id">{a.createdBy || '—'}</td>
                <td className="adm-td-date">{a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                <td>
                  <div className="adm-actions">
                    {canManage(a) && (
                      <>
                        <button
                          className={`adm-btn-sm ${a.status === 'suspended' ? 'adm-btn-green' : 'adm-btn-red'}`}
                          onClick={() => handleSuspend(a)}
                          title={a.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        >
                          {a.status === 'suspended' ? <CheckCircleOutlined /> : <StopOutlined />}
                        </button>
                        <button className="adm-btn-sm adm-btn-red" onClick={() => handleDelete(a)} title="Delete">
                          <DeleteOutlined />
                        </button>
                      </>
                    )}
                    {a.role === 'Super Admin' && a.key !== currentAdmin?.key && (
                      <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>Protected</span>
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
        {admins.map((a) => (
          <div key={a.key} className={`adm-card ${a.key === currentAdmin?.key ? 'adm-card-selected' : ''} ${a.status === 'suspended' ? 'adm-card-suspended' : ''}`}>
            <div className="adm-card-row adm-card-row-between">
              <span className="adm-card-name">
                {a.role === 'Super Admin' && <CrownOutlined style={{ color: 'var(--accent)', marginRight: 6 }} />}
                {a.name}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <Tag color={roleTagColor(a.role)}>{a.role}</Tag>
                <Tag color={a.status === 'suspended' ? 'red' : 'green'}>
                  {a.status === 'suspended' ? 'Suspended' : 'Active'}
                </Tag>
              </div>
            </div>
            <div className="adm-card-row">
              <span className="adm-card-vehicle"><IdcardOutlined /> {a.empId}</span>
            </div>
            <div className="adm-card-row">
              <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>
                <LockOutlined /> Password encrypted
              </span>
            </div>
            <div className="adm-card-row adm-card-row-between adm-card-meta">
              <span>By: {a.createdBy || '—'}</span>
              <span>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
            </div>

            {/* Actions — only for manageable admins */}
            {canManage(a) && (
              <div className="adm-card-actions">
                <select
                  className="adm-filter-select"
                  value={a.role}
                  onChange={(e) => handleRoleChange(a, e.target.value)}
                  style={{ flex: 1, minHeight: 38, fontSize: 12 }}
                >
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Support">Support</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <button
                  className={`adm-action-btn ${a.status === 'suspended' ? 'adm-action-green' : 'adm-action-red'}`}
                  onClick={() => handleSuspend(a)}
                >
                  {a.status === 'suspended' ? <><CheckCircleOutlined /> Activate</> : <><StopOutlined /> Suspend</>}
                </button>
                <button className="adm-action-btn adm-action-red" onClick={() => handleDelete(a)}>
                  <DeleteOutlined />
                </button>
              </div>
            )}

            {/* Labels for protected / self */}
            {a.key === currentAdmin?.key && (
              <div className="adm-card-meta" style={{ marginTop: 8 }}>
                <span style={{ color: 'var(--accent)' }}><CrownOutlined /> This is your account</span>
              </div>
            )}
            {a.role === 'Super Admin' && a.key !== currentAdmin?.key && (
              <div className="adm-card-meta" style={{ marginTop: 8 }}>
                <span style={{ color: 'var(--text-faint)' }}><LockOutlined /> Protected — Super Admins cannot be managed</span>
              </div>
            )}
          </div>
        ))}
        {admins.length === 0 && <p className="adm-empty">No admins found</p>}
      </div>
    </div>
  )
}

export default AdminManagement
