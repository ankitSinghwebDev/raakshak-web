import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { Card, Row, Col, Tag, Table, Statistic, Divider, Typography, Input, Button } from 'antd'
import {
  WalletOutlined, DollarOutlined, CalendarOutlined,
  BankOutlined, PercentageOutlined, MinusCircleOutlined, EditOutlined,
} from '@ant-design/icons'
import { db, ref, get, set } from '../../config/firebase'
import { DashboardSkeleton } from './AdminSkeleton'

const { Text } = Typography

const FinancePanel = () => {
  const [customers, setCustomers] = useState([])
  const [partners, setPartners] = useState([])
  const [expenses, setExpenses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editingExpense, setEditingExpense] = useState(false)
  const [expenseDraft, setExpenseDraft] = useState('')
  const [savingExpense, setSavingExpense] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [custSnap, partnerSnap, expSnap] = await Promise.all([
          get(ref(db, 'customers')),
          get(ref(db, 'partners')),
          get(ref(db, 'finance/expenses')),
        ])
        if (custSnap.exists()) setCustomers(Object.entries(custSnap.val()).map(([k, v]) => ({ key: k, ...v })))
        if (partnerSnap.exists()) setPartners(Object.entries(partnerSnap.val()).map(([k, v]) => ({ key: k, ...v })))
        if (expSnap.exists()) setExpenses(Number(expSnap.val()) || 0)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleSaveExpense = async () => {
    const value = Number(expenseDraft)
    if (Number.isNaN(value) || value < 0) {
      toast.error('Enter a valid non-negative amount')
      return
    }
    setSavingExpense(true)
    try {
      await set(ref(db, 'finance/expenses'), value)
      setExpenses(value)
      setEditingExpense(false)
      toast.success('Expenses updated')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update expenses')
    } finally {
      setSavingExpense(false)
    }
  }

  const data = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().toISOString().substring(0, 7)

    let totalRev = 0, todayRev = 0, monthRev = 0
    const monthlyMap = {}
    const planRevMap = {}

    customers.forEach((c) => {
      const amt = parseInt(c.amount) || 0
      totalRev += amt
      const day = c.timestamp?.split('T')[0]
      const month = c.timestamp?.substring(0, 7)
      if (day === today) todayRev += amt
      if (month === thisMonth) monthRev += amt

      if (month) monthlyMap[month] = (monthlyMap[month] || 0) + amt

      const plan = c.plan || 'Other'
      planRevMap[plan] = (planRevMap[plan] || 0) + amt
    })

    const totalPendingComm = partners.reduce((s, p) => s + (p.pendingComm || 0), 0)
    const totalPaidComm = partners.reduce((s, p) => s + ((p.totalRevenue || 0) * (p.comm || 0) / 100), 0)
    const totalCommissions = totalPendingComm + totalPaidComm
    // Net Revenue = Total Revenue - Expenses - All Commissions (paid + pending)
    const netRevenue = totalRev - expenses - totalCommissions

    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = d.toISOString().substring(0, 7)
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      last6Months.push({ month: key, label, revenue: monthlyMap[key] || 0 })
    }
    const maxMonthRev = Math.max(...last6Months.map((m) => m.revenue), 1)

    // Recent transactions
    const transactions = [...customers]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
      .map((c) => ({
        key: c.key,
        name: c.name,
        vehicle: c.vehicle,
        amount: parseInt(c.amount) || 0,
        paymentId: c.paymentId,
        plan: c.plan,
        date: c.timestamp,
      }))

    return {
      totalRev, todayRev, monthRev, netRevenue,
      totalPendingComm, totalPaidComm, totalCommissions, planRevMap,
      last6Months, maxMonthRev, transactions,
    }
  }, [customers, partners, expenses])

  if (loading) return <DashboardSkeleton />

  return (
    <div className="adm-dashboard">
      {/* KPIs */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={12} sm={6}>
          <Card size="small" className="adm-kpi-card">
            <Statistic title="Total Revenue" value={data.totalRev} prefix={<DollarOutlined />} formatter={(v) => `₹${Number(v).toLocaleString()}`} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="adm-kpi-card">
            {editingExpense ? (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 700 }}>TOTAL EXPENSES</div>
                <Input
                  type="number"
                  size="small"
                  autoFocus
                  prefix="₹"
                  value={expenseDraft}
                  onChange={(e) => setExpenseDraft(e.target.value)}
                  onPressEnter={handleSaveExpense}
                  placeholder="0"
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <Button size="small" type="primary" loading={savingExpense} onClick={handleSaveExpense}>Save</Button>
                  <Button size="small" onClick={() => setEditingExpense(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Statistic
                  title="Total Expenses"
                  value={expenses}
                  prefix={<MinusCircleOutlined />}
                  formatter={(v) => `₹${Number(v).toLocaleString()}`}
                  valueStyle={{ color: 'var(--red, #ff6b6b)' }}
                />
                <EditOutlined
                  onClick={() => { setExpenseDraft(String(expenses)); setEditingExpense(true) }}
                  style={{ position: 'absolute', top: 0, right: 0, cursor: 'pointer', color: 'var(--text-dim)', fontSize: 14 }}
                  title="Edit expenses"
                />
              </div>
            )}
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="adm-kpi-card">
            <Statistic
              title="Total Commissions"
              value={data.totalCommissions}
              prefix={<PercentageOutlined />}
              formatter={(v) => `₹${Number(v).toLocaleString()}`}
              valueStyle={{ color: 'var(--accent)' }}
            />
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
              Paid ₹{data.totalPaidComm.toLocaleString()} · Pending ₹{data.totalPendingComm.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="adm-kpi-card">
            <Statistic title="Net Revenue" value={data.netRevenue} prefix={<BankOutlined />} formatter={(v) => `₹${Number(v).toLocaleString()}`}
              valueStyle={{ color: data.netRevenue >= 0 ? 'var(--green)' : 'var(--red)' }}
            />
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
              Revenue − Expenses − Commissions
            </div>
          </Card>
        </Col>
      </Row>

      {/* Secondary stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small" className="adm-kpi-card">
            <Statistic title="Today Revenue" value={data.todayRev} prefix="₹" formatter={(v) => Number(v).toLocaleString()} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="adm-kpi-card">
            <Statistic title="This Month" value={data.monthRev} prefix="₹" formatter={(v) => Number(v).toLocaleString()} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Monthly Revenue Chart */}
        <Col xs={24} lg={14}>
          <Card title={<><CalendarOutlined /> Monthly Revenue</>} size="small" className="adm-chart-card">
            <div className="adm-bar-chart" style={{ height: 160 }}>
              {data.last6Months.map((m) => (
                <div key={m.month} className="adm-bar-col">
                  <span className="adm-bar-value">₹{(m.revenue / 1000).toFixed(1)}k</span>
                  <div className="adm-bar" style={{ height: `${(m.revenue / data.maxMonthRev) * 100}%` }} />
                  <span className="adm-bar-label">{m.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Revenue by Plan */}
        <Col xs={24} lg={10}>
          <Card title={<><WalletOutlined /> Revenue by Plan</>} size="small" className="adm-chart-card">
            {Object.entries(data.planRevMap).map(([plan, rev]) => (
              <div key={plan} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: 'var(--text-secondary)' }}>{plan}</Text>
                  <Text strong style={{ color: 'var(--text-primary)' }}>₹{rev.toLocaleString()}</Text>
                </div>
                <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(rev / data.totalRev) * 100}%`, background: '#d97706', borderRadius: 3 }} />
                </div>
              </div>
            ))}
            <Divider style={{ margin: '16px 0 12px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text style={{ color: 'var(--text-dim)' }}>This Month</Text>
              <Tag color="green">₹{data.monthRev.toLocaleString()}</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Transactions */}
      <Card title={<><BankOutlined /> Recent Transactions</>} size="small" className="adm-chart-card">
        <div className="adm-desktop-only">
          <Table dataSource={data.transactions} rowKey="key" pagination={false} size="small" columns={[
            { title: 'Name', dataIndex: 'name', render: (v) => <Text strong style={{ color: 'var(--text-primary)' }}>{v}</Text> },
            { title: 'Vehicle', dataIndex: 'vehicle', render: (v) => <Text style={{ color: 'var(--accent)', fontWeight: 700 }}>{v}</Text> },
            { title: 'Plan', dataIndex: 'plan', render: (v) => <Tag color={v === 'Lite Plan' ? 'default' : 'orange'}>{v}</Tag> },
            { title: 'Amount', dataIndex: 'amount', render: (v) => <Text strong>₹{v}</Text> },
            { title: 'Payment ID', dataIndex: 'paymentId', ellipsis: true, render: (v) => <Text style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{v || '—'}</Text> },
            { title: 'Date', dataIndex: 'date', render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
          ]} />
        </div>
        <div className="adm-mobile-only">
          {data.transactions.map((t) => (
            <div key={t.key} className="adm-card" style={{ marginBottom: 8 }}>
              <div className="adm-card-row adm-card-row-between">
                <span className="adm-card-name">{t.name}</span>
                <Tag color="green">₹{t.amount}</Tag>
              </div>
              <div className="adm-card-row"><span className="adm-card-vehicle">{t.vehicle}</span></div>
              <div className="adm-card-row adm-card-row-between adm-card-meta">
                <span>{t.plan}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{t.paymentId?.slice(0, 14) || '—'}</span>
                <span>{t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default FinancePanel
