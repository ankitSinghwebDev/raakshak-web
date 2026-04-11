import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  CreditCardOutlined,
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  LeftOutlined,
  LinkOutlined,
  PlusOutlined,
  QrcodeOutlined,
  RadarChartOutlined,
  RightOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Card, Carousel, Col, Drawer, Empty, Input, Row, Segmented, Tag } from 'antd'
import { db, get, push, ref, set, update } from '../../config/firebase'
import { ACTIONS, logAdminAction } from '../../utils/auditLog'
import { buildPublicSiteUrl, generateQRCodeUrl } from '../../utils/helpers'
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
  Showroom: 'RAKSR',
}

const ACTIVITY_META = {
  pro: { label: 'Pro Active', color: 'green', accent: '#22c55e', helper: 'Fresh joins in last 24h' },
  active: { label: 'Active', color: 'cyan', accent: '#10b981', helper: 'Fresh joins in last 72h' },
  low: { label: 'Low Active', color: 'orange', accent: '#f59e0b', helper: 'Fresh joins in last 7 days' },
  almost: { label: 'Almost Inactive', color: 'volcano', accent: '#f97316', helper: 'No joins in last 15 days' },
  inactive: { label: 'Inactive', color: 'default', accent: '#94a3b8', helper: 'No fresh joins in 15+ days' },
}

const toCaps = (value) => value.toUpperCase()
const normalizeCode = (value) => String(value || '').trim().toUpperCase()
const safeNumber = (value) => Number(value || 0) || 0

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

const getPartnerQrValue = (partner) => buildPublicSiteUrl('/', { ref: partner.code })

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
  <text x="210" y="520" text-anchor="middle" fill="#9a9a9a" font-size="12" font-family="Arial, sans-serif">Scan or open to register with partner attribution</text>
</svg>`.trim()
}

const formatMoney = (value) => `₹${safeNumber(value).toLocaleString('en-IN')}`

const formatDate = (value, withTime = false) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' })
}

const hoursSince = (value) => {
  if (!value) return Number.POSITIVE_INFINITY
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return Number.POSITIVE_INFINITY
  return (Date.now() - date.getTime()) / (1000 * 60 * 60)
}

const resolveActivityState = (latestJoinAt, joins) => {
  if (!joins || !latestJoinAt) return { key: 'inactive', ...ACTIVITY_META.inactive }

  const diffHours = hoursSince(latestJoinAt)
  if (diffHours <= 24) return { key: 'pro', ...ACTIVITY_META.pro }
  if (diffHours <= 72) return { key: 'active', ...ACTIVITY_META.active }
  if (diffHours <= 24 * 7) return { key: 'low', ...ACTIVITY_META.low }
  if (diffHours <= 24 * 15) return { key: 'almost', ...ACTIVITY_META.almost }
  return { key: 'inactive', ...ACTIVITY_META.inactive }
}

const resolvePartnerJoinSource = (customer, partnerCode) => {
  const coupon = normalizeCode(customer.coupon)
  const storedPartnerCode = normalizeCode(customer.partnerCode)
  if (coupon !== partnerCode && storedPartnerCode !== partnerCode) return null

  const source = String(customer.registrationSource || '').toLowerCase()
  const entry = String(customer.registrationEntry || '').toLowerCase()

  if (source === 'partner_qr' || entry === 'qr_link') return 'partner_qr'
  if (source === 'partner_code' || entry === 'manual_code') return 'partner_code'
  return 'legacy_partner'
}

const calculateActivityScore = ({ joins, recent24h, recent72h, recent7d, downstreamScans, qrJoins, codeJoins }) => {
  return Math.round(
    recent24h * 24 +
    Math.max(recent72h - recent24h, 0) * 14 +
    Math.max(recent7d - recent72h, 0) * 7 +
    joins * 2 +
    downstreamScans * 0.75 +
    qrJoins * 2 +
    codeJoins
  )
}

const PartnerManagement = ({ setTopbarActions = null }) => {
  const [partners, setPartners] = useState([])
  const [customers, setCustomers] = useState([])
  const [scans, setScans] = useState([])
  const [payoutHistory, setPayoutHistory] = useState({})
  const [loading, setLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [partnerForm, setPartnerForm] = useState(EMPTY_PARTNER_FORM)
  const [editingPartner, setEditingPartner] = useState(null)
  const [savingPartner, setSavingPartner] = useState(false)
  const [previewPartner, setPreviewPartner] = useState(null)
  const [viewingPartner, setViewingPartner] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [activeView, setActiveView] = useState('overview')
  const [activityFilter, setActivityFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [paymentPartner, setPaymentPartner] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ amount: '', transactionId: '' })
  const [savingPayment, setSavingPayment] = useState(false)
  const spotlightCarouselRef = useRef(null)

  const refreshPartnerData = useCallback(async () => {
    const [partnerSnap, customerSnap, scanSnap, payoutSnap] = await Promise.all([
      get(ref(db, 'partners')),
      get(ref(db, 'customers')),
      get(ref(db, 'scans')),
      get(ref(db, 'payoutHistory')),
    ])

    const nextPartners = partnerSnap.exists()
      ? Object.entries(partnerSnap.val())
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0))
      : []

    const nextCustomers = customerSnap.exists()
      ? Object.entries(customerSnap.val()).map(([key, value]) => ({ key, ...value }))
      : []

    const nextScans = []
    if (scanSnap.exists()) {
      Object.entries(scanSnap.val()).forEach(([customerKey, customerScans]) => {
        Object.entries(customerScans || {}).forEach(([scanKey, scan]) => {
          nextScans.push({ key: scanKey, customerKey, ...scan })
        })
      })
    }

    setPartners(nextPartners)
    setCustomers(nextCustomers)
    setScans(nextScans)
    setPayoutHistory(payoutSnap.exists() ? payoutSnap.val() || {} : {})
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        await refreshPartnerData()
      } catch (err) {
        console.error(err)
        toast.error('Failed to load partner panel data.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [refreshPartnerData])

  const typeOptions = useMemo(() => {
    const dynamicTypes = partners
      .map((partner) => partner.type)
      .filter(Boolean)
      .filter((type, index, list) => list.indexOf(type) === index && !DEFAULT_TYPE_OPTIONS.includes(type))
    return [...DEFAULT_TYPE_OPTIONS, ...dynamicTypes]
  }, [partners])

  const partnerAnalytics = useMemo(() => {
    const scanCountByCustomer = new Map()
    scans.forEach((scan) => {
      scanCountByCustomer.set(scan.customerKey, (scanCountByCustomer.get(scan.customerKey) || 0) + 1)
    })

    const payoutTotalsByPartner = new Map()
    Object.entries(payoutHistory || {}).forEach(([partnerKey, items]) => {
      const total = Object.values(items || {}).reduce((sum, item) => sum + safeNumber(item.amount), 0)
      payoutTotalsByPartner.set(partnerKey, total)
    })

    const rows = partners.map((partner) => {
      const partnerCode = normalizeCode(partner.code)
      const attributedCustomers = customers
        .filter((customer) => normalizeCode(customer.coupon) === partnerCode || normalizeCode(customer.partnerCode) === partnerCode)
        .map((customer) => {
          const joinSource = resolvePartnerJoinSource(customer, partnerCode) || 'legacy_partner'
          const scanCount = scanCountByCustomer.get(customer.key) || safeNumber(customer.totalScans)
          return {
            ...customer,
            joinSource,
            scanCount,
          }
        })
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))

      const joins = attributedCustomers.length
      const qrJoins = attributedCustomers.filter((customer) => customer.joinSource === 'partner_qr').length
      const codeJoins = attributedCustomers.filter((customer) => customer.joinSource === 'partner_code').length
      const legacyJoins = attributedCustomers.filter((customer) => customer.joinSource === 'legacy_partner').length
      const downstreamScans = attributedCustomers.reduce((sum, customer) => sum + safeNumber(customer.scanCount), 0)
      const derivedRevenue = attributedCustomers.reduce((sum, customer) => sum + safeNumber(customer.amount), 0)
      const totalRevenue = Math.max(safeNumber(partner.totalRevenue), derivedRevenue)
      const totalSales = Math.max(safeNumber(partner.totalSales), joins)
      const latestJoinAt = attributedCustomers[0]?.timestamp || ''
      const recent24h = attributedCustomers.filter((customer) => hoursSince(customer.timestamp) <= 24).length
      const recent72h = attributedCustomers.filter((customer) => hoursSince(customer.timestamp) <= 72).length
      const recent7d = attributedCustomers.filter((customer) => hoursSince(customer.timestamp) <= 24 * 7).length
      const recent30d = attributedCustomers.filter((customer) => hoursSince(customer.timestamp) <= 24 * 30).length
      const activityState = resolveActivityState(latestJoinAt, joins)
      const activityScore = calculateActivityScore({
        joins,
        recent24h,
        recent72h,
        recent7d,
        downstreamScans,
        qrJoins,
        codeJoins,
      })

      return {
        ...partner,
        code: partner.code || '—',
        totalSales,
        totalRevenue,
        joins,
        qrJoins,
        codeJoins,
        legacyJoins,
        downstreamScans,
        recent24h,
        recent72h,
        recent7d,
        recent30d,
        latestJoinAt,
        activityState,
        activityScore,
        paidOut: payoutTotalsByPartner.get(partner.key) || 0,
        attributedCustomers,
      }
    }).sort((left, right) => {
      if (right.activityScore !== left.activityScore) return right.activityScore - left.activityScore
      if (right.joins !== left.joins) return right.joins - left.joins
      return safeNumber(right.totalRevenue) - safeNumber(left.totalRevenue)
    })

    const countsByState = rows.reduce((acc, row) => {
      acc[row.activityState.key] = (acc[row.activityState.key] || 0) + 1
      return acc
    }, { pro: 0, active: 0, low: 0, almost: 0, inactive: 0 })

    const cityMap = rows.reduce((acc, row) => {
      const cityKey = toCaps(row.city || 'UNKNOWN')
      if (!acc[cityKey]) {
        acc[cityKey] = { city: cityKey, state: row.state || '—', partners: 0, joins: 0, revenue: 0 }
      }
      acc[cityKey].partners += 1
      acc[cityKey].joins += row.joins
      acc[cityKey].revenue += safeNumber(row.totalRevenue)
      return acc
    }, {})

    const topCities = Object.values(cityMap)
      .sort((left, right) => right.joins - left.joins || right.partners - left.partners)
      .slice(0, 5)

    const totalAttributedUsers = rows.reduce((sum, row) => sum + row.joins, 0)
    const totalQrJoins = rows.reduce((sum, row) => sum + row.qrJoins, 0)
    const totalCodeJoins = rows.reduce((sum, row) => sum + row.codeJoins, 0)
    const totalLegacyJoins = rows.reduce((sum, row) => sum + row.legacyJoins, 0)
    const totalDownstreamScans = rows.reduce((sum, row) => sum + row.downstreamScans, 0)
    const totalPendingPayout = rows.reduce((sum, row) => sum + safeNumber(row.pendingComm), 0)
    const totalPaidOut = rows.reduce((sum, row) => sum + safeNumber(row.paidOut), 0)
    const totalPartnerRevenue = rows.reduce((sum, row) => sum + safeNumber(row.totalRevenue), 0)

    return {
      rows,
      byKey: new Map(rows.map((row) => [row.key, row])),
      mostActivePartner: rows[0] || null,
      topPartners: rows.slice(0, 3),
      topCities,
      countsByState,
      totalAttributedUsers,
      totalQrJoins,
      totalCodeJoins,
      totalLegacyJoins,
      totalDownstreamScans,
      totalPendingPayout,
      totalPaidOut,
      totalPartnerRevenue,
    }
  }, [customers, partners, payoutHistory, scans])

  const filteredPartnerRows = useMemo(() => {
    return partnerAnalytics.rows.filter((partner) => {
      const searchQuery = search.trim().toLowerCase()
      const matchesSearch = !searchQuery || [
        partner.name,
        partner.shop,
        partner.code,
        partner.mobile,
        partner.city,
        partner.state,
      ].some((value) => String(value || '').toLowerCase().includes(searchQuery))

      const matchesActivity = activeView !== 'activity' || activityFilter === 'all' || partner.activityState.key === activityFilter
      return matchesSearch && matchesActivity
    })
  }, [activeView, activityFilter, partnerAnalytics.rows, search])

  const paymentLedger = useMemo(() => {
    const now = Date.now()
    const payoutEntries = []

    Object.entries(payoutHistory || {}).forEach(([partnerKey, items]) => {
      Object.entries(items || {}).forEach(([entryKey, entry]) => {
        payoutEntries.push({ key: entryKey, partnerKey, ...entry })
      })
    })

    let todayPaid = 0
    let weeklyPaid = 0
    let monthlyPaid = 0

    payoutEntries.forEach((entry) => {
      const amount = safeNumber(entry.amount)
      const paidAt = new Date(entry.paidAt || entry.timestamp || 0).getTime()
      if (!paidAt) return
      const diffDays = (now - paidAt) / (1000 * 60 * 60 * 24)
      if (diffDays <= 1) todayPaid += amount
      if (diffDays <= 7) weeklyPaid += amount
      if (diffDays <= 30) monthlyPaid += amount
    })

    const rows = partnerAnalytics.rows.map((partner) => {
      const commissionRate = safeNumber(partner.comm)
      const commissionFromSales = Math.max(safeNumber(partner.totalSales), partner.joins) * commissionRate
      const amountPaid = safeNumber(partner.paidOut)
      const pendingBalance = Math.max(safeNumber(partner.pendingComm), commissionFromSales - amountPaid, 0)
      const totalEarned = Math.max(commissionFromSales, amountPaid + pendingBalance)

      let paymentStatus = {
        key: 'no_earning',
        label: 'No Earning',
        color: 'default',
      }

      if (totalEarned > 0 && pendingBalance <= 0) {
        paymentStatus = { key: 'paid', label: 'Paid', color: 'green' }
      } else if (amountPaid > 0 && pendingBalance > 0) {
        paymentStatus = { key: 'partial', label: 'Partial Paid', color: 'orange' }
      } else if (pendingBalance > 0) {
        paymentStatus = { key: 'unpaid', label: 'Unpaid', color: 'red' }
      }

      return {
        ...partner,
        commissionRate,
        totalEarned,
        amountPaid,
        pendingBalance,
        paymentStatus,
      }
    }).sort((left, right) => {
      if (right.pendingBalance !== left.pendingBalance) return right.pendingBalance - left.pendingBalance
      if (right.totalEarned !== left.totalEarned) return right.totalEarned - left.totalEarned
      return left.name.localeCompare(right.name)
    })

    return {
      rows,
      byKey: new Map(rows.map((row) => [row.key, row])),
      todayPaid,
      weeklyPaid,
      monthlyPaid,
      totalPending: rows.reduce((sum, row) => sum + row.pendingBalance, 0),
    }
  }, [partnerAnalytics.rows, payoutHistory])

  const filteredPaymentRows = useMemo(() => {
    return paymentLedger.rows.filter((partner) => {
      const searchQuery = search.trim().toLowerCase()
      const matchesSearch = !searchQuery || [
        partner.name,
        partner.shop,
        partner.code,
        partner.mobile,
        partner.city,
        partner.state,
      ].some((value) => String(value || '').toLowerCase().includes(searchQuery))

      const matchesPayment = paymentFilter === 'all' || partner.paymentStatus.key === paymentFilter
      return matchesSearch && matchesPayment
    })
  }, [paymentFilter, paymentLedger.rows, search])

  const viewingPartnerData = viewingPartner ? partnerAnalytics.byKey.get(viewingPartner.key) : null
  const paymentPartnerData = paymentPartner || null

  const openCreateModal = useCallback(() => {
    setEditingPartner(null)
    setPartnerForm(EMPTY_PARTNER_FORM)
    setShowFormModal(true)
  }, [])

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
    if (safeNumber(comm) <= 0) {
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
      comm: safeNumber(partnerForm.comm),
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

      await refreshPartnerData()
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
      await update(ref(db, `partners/${partner.key}`), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
      await logAdminAction(
        newStatus === 'active' ? ACTIONS.PARTNER_ACTIVATED : ACTIONS.PARTNER_DEACTIVATED,
        partner.key,
        partner.name,
        { code: partner.code }
      )
      await refreshPartnerData()
      toast.success(`${partner.name} ${newStatus}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update partner status.')
    }
  }

  const openPaymentModal = useCallback((partner) => {
    if (safeNumber(partner.pendingBalance) <= 0) {
      toast.error('No pending commission available for payout.')
      return
    }
    setPaymentPartner(partner)
    setPaymentForm({
      amount: String(safeNumber(partner.pendingBalance)),
      transactionId: '',
    })
  }, [])

  const closePaymentModal = useCallback(() => {
    setPaymentPartner(null)
    setPaymentForm({ amount: '', transactionId: '' })
    setSavingPayment(false)
  }, [])

  const handleSavePayment = useCallback(async () => {
    if (!paymentPartnerData) return

    const amount = safeNumber(paymentForm.amount)
    const transactionId = paymentForm.transactionId.trim()
    const pendingBalance = safeNumber(paymentPartnerData.pendingBalance)

    if (amount <= 0) {
      toast.error('Enter a valid payment amount.')
      return
    }
    if (amount > pendingBalance) {
      toast.error(`Amount cannot exceed pending balance ${formatMoney(pendingBalance)}.`)
      return
    }
    if (!transactionId) {
      toast.error('Transaction ID is required.')
      return
    }

    setSavingPayment(true)
    try {
      const paidAt = new Date().toISOString()
      const nextPending = Math.max(pendingBalance - amount, 0)

      await push(ref(db, `payoutHistory/${paymentPartnerData.key}`), {
        amount,
        transactionId,
        trxId: transactionId,
        partnerName: paymentPartnerData.name,
        shop: paymentPartnerData.shop,
        code: paymentPartnerData.code,
        paidAt,
        paidBy: JSON.parse(sessionStorage.getItem('rakshak_admin') || '{}').name || 'Admin',
        pendingBefore: pendingBalance,
        pendingAfter: nextPending,
      })

      await update(ref(db, `partners/${paymentPartnerData.key}`), {
        pendingComm: nextPending,
        lastPaidAt: paidAt,
        updatedAt: paidAt,
      })

      await logAdminAction(ACTIONS.PARTNER_COMMISSION_PAID, paymentPartnerData.key, paymentPartnerData.name, {
        amount,
        transactionId,
        pendingAfter: nextPending,
      })

      await refreshPartnerData()
      closePaymentModal()
      toast.success(`${formatMoney(amount)} payout recorded for ${paymentPartnerData.name}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save payout.')
      setSavingPayment(false)
    }
  }, [closePaymentModal, paymentForm.amount, paymentForm.transactionId, paymentPartnerData, refreshPartnerData])

  const handleExportPartners = useCallback(async () => {
    setExporting(true)
    try {
      const rows = filteredPartnerRows.map((partner) => ({
        'Partner Name': partner.name || '—',
        'Shop Name': partner.shop || '—',
        'Partner Code': partner.code || '—',
        'Shop Type': partner.type || '—',
        'Mobile': partner.mobile || '—',
        'City': partner.city || '—',
        'State': partner.state || '—',
        'Status': partner.status || 'active',
        'Activity State': partner.activityState.label,
        'Attributed Users': partner.joins,
        'Joined Via QR': partner.qrJoins,
        'Joined Via Code': partner.codeJoins,
        'Legacy Attribution': partner.legacyJoins,
        'Network Scans': partner.downstreamScans,
        'Tracked Revenue (₹)': partner.totalRevenue,
        'Commission Rate (₹)': partner.comm || 0,
        'Pending Commission (₹)': partner.pendingComm || 0,
        'Paid Out (₹)': partner.paidOut || 0,
        'Last Join': formatDate(partner.latestJoinAt, true),
      }))

      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'No Data': 'No partners found' }])
      ws['!cols'] = Object.keys(rows[0] || {}).map((key) => ({ wch: Math.max(key.length + 2, 16) }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Partner Analytics')
      XLSX.writeFile(wb, `Rakshak_Partner_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`)
      await logAdminAction(ACTIONS.DATA_EXPORTED, 'partners', 'Partner Analytics', { rows: rows.length })
      toast.success('Partner analytics exported!')
    } catch (err) {
      console.error(err)
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }, [filteredPartnerRows])

  const handleExportPayments = useCallback(async () => {
    setExporting(true)
    try {
      const rows = filteredPaymentRows.map((partner) => ({
        'Partner Name': partner.name || '—',
        'Shop Name': partner.shop || '—',
        'Partner Code': partner.code || '—',
        'Commission Rate (₹)': partner.commissionRate,
        'Total Earned (₹)': partner.totalEarned,
        'Amount Paid (₹)': partner.amountPaid,
        'Pending Balance (₹)': partner.pendingBalance,
        'Payment Status': partner.paymentStatus.label,
        'Last Join': formatDate(partner.latestJoinAt, true),
        'Last Payout': formatDate(partner.lastPaidAt, true),
      }))

      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'No Data': 'No payment rows found' }])
      ws['!cols'] = Object.keys(rows[0] || {}).map((key) => ({ wch: Math.max(key.length + 2, 18) }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Partner Payments')
      XLSX.writeFile(wb, `Rakshak_Partner_Payments_${new Date().toISOString().split('T')[0]}.xlsx`)
      await logAdminAction(ACTIONS.DATA_EXPORTED, 'partner-payments', 'Partner Payments', { rows: rows.length })
      toast.success('Partner payment ledger exported!')
    } catch (err) {
      console.error(err)
      toast.error('Payment export failed')
    } finally {
      setExporting(false)
    }
  }, [filteredPaymentRows])

  const handleExportActiveView = useCallback(async () => {
    if (activeView === 'payments') {
      await handleExportPayments()
      return
    }
    await handleExportPartners()
  }, [activeView, handleExportPartners, handleExportPayments])

  const partnerTopbarActions = useMemo(() => (
    <div className="adm-partner-header-controls">
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Search partner, code, shop, city..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="adm-partner-search"
      />
      <button className="adm-icon-btn adm-partner-download-btn" onClick={handleExportActiveView} disabled={exporting} title={activeView === 'payments' ? 'Download Payment Ledger' : 'Download Partner Analytics'}>
        <DownloadOutlined />
        <span>Download</span>
      </button>
      <button className="adm-add-btn" onClick={openCreateModal}>
        <PlusOutlined /> Add Partner
      </button>
    </div>
  ), [activeView, exporting, handleExportActiveView, openCreateModal, search])

  useEffect(() => {
    if (!setTopbarActions) return undefined
    setTopbarActions(partnerTopbarActions)
    return () => setTopbarActions(null)
  }, [partnerTopbarActions, setTopbarActions])

  if (loading) return <ListSkeleton />

  const overviewCards = [
    {
      label: 'Total Partners',
      value: partners.length,
      helper: `${partners.filter((partner) => partner.status !== 'inactive').length} active right now`,
      icon: <TeamOutlined />,
    },
    {
      label: 'Attributed Users',
      value: partnerAnalytics.totalAttributedUsers,
      helper: `${partnerAnalytics.totalQrJoins} via QR · ${partnerAnalytics.totalCodeJoins} via code`,
      icon: <UserOutlined />,
    },
    {
      label: 'Partner Revenue',
      value: formatMoney(partnerAnalytics.totalPartnerRevenue),
      helper: `${formatMoney(partnerAnalytics.totalPaidOut)} paid out so far`,
      icon: <DollarOutlined />,
    },
    {
      label: 'Pending Payout',
      value: formatMoney(paymentLedger.totalPending),
      helper: `${partnerAnalytics.totalLegacyJoins} legacy-attributed joins`,
      icon: <ClockCircleOutlined />,
    },
    {
      label: 'Most Active Partner',
      value: partnerAnalytics.mostActivePartner?.name || '—',
      helper: partnerAnalytics.mostActivePartner
        ? `${partnerAnalytics.mostActivePartner.joins} joins · score ${partnerAnalytics.mostActivePartner.activityScore}`
        : 'No partner activity yet',
      icon: <BarChartOutlined />,
    },
    {
      label: 'Network Scans',
      value: partnerAnalytics.totalDownstreamScans,
      helper: 'Scans generated by partner-attributed customers',
      icon: <RadarChartOutlined />,
    },
  ]

  const renderActionButtons = (partner) => {
    const paymentRow = paymentLedger.byKey.get(partner.key)

    return (
      <div className="adm-actions">
        <button className="adm-btn-sm" onClick={() => openEditModal(partner)} title="Edit Partner">
          <EditOutlined />
        </button>
        <button
          className={`adm-btn-sm ${partner.status === 'active' ? 'adm-btn-red' : 'adm-btn-green'}`}
          onClick={() => toggleStatus(partner)}
          title={partner.status === 'active' ? 'Deactivate' : 'Activate'}
        >
          {partner.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
        </button>
        {safeNumber(paymentRow?.pendingBalance) > 0 && (
          <button className="adm-btn-sm adm-btn-green" onClick={() => openPaymentModal(paymentRow)} title="Record Payment">
            <CreditCardOutlined />
          </button>
        )}
        <button className="adm-btn-sm" onClick={() => setPreviewPartner(partner)} title="View Partner Card">
          <QrcodeOutlined />
        </button>
        <button className="adm-btn-sm" onClick={() => setViewingPartner(partner)} title="View Activity">
          👥
        </button>
      </div>
    )
  }

  return (
    <div className="adm-partner-shell">
      <div className="adm-partner-summary-row">
        <span className="adm-result-count">
          {partners.length} partners · {partnerAnalytics.totalAttributedUsers} attributed users
        </span>
      </div>

      <div className="adm-partner-view-switch">
        <Segmented
          options={[
            { label: 'Overview', value: 'overview' },
            { label: 'Activity', value: 'activity' },
            { label: 'Payments', value: 'payments' },
            { label: 'Directory', value: 'directory' },
          ]}
          value={activeView}
          onChange={setActiveView}
        />
      </div>

      {activeView === 'overview' && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
            {overviewCards.map((card) => (
              <Col xs={24} sm={12} xl={8} key={card.label}>
                <Card size="small" className="adm-kpi-card adm-chart-card">
                  <div className="adm-partner-overview-card">
                    <span className="adm-partner-overview-icon">{card.icon}</span>
                    <div>
                      <p>{card.label}</p>
                      <h3>{card.value}</h3>
                      <span>{card.helper}</span>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <div className="adm-partner-spotlights">
            <div className="adm-partner-section-head">
              <div>
                <h4>Top Performing Partners</h4>
                <p>Use the arrows to review the strongest partner cards.</p>
              </div>
              {partnerAnalytics.topPartners.length > 1 && (
                <div className="adm-partner-carousel-controls">
                  <button type="button" className="adm-icon-btn" onClick={() => spotlightCarouselRef.current?.prev()}>
                    <LeftOutlined />
                  </button>
                  <button type="button" className="adm-icon-btn" onClick={() => spotlightCarouselRef.current?.next()}>
                    <RightOutlined />
                  </button>
                </div>
              )}
            </div>

            {partnerAnalytics.topPartners.length === 0 ? (
              <div className="adm-partner-empty-card">
                <Empty description="No partner activity yet" />
              </div>
            ) : (
              <Carousel
                ref={spotlightCarouselRef}
                className="adm-partner-spotlight-carousel"
                dots={partnerAnalytics.topPartners.length > 1}
                arrows={false}
                infinite={partnerAnalytics.topPartners.length > 3}
                draggable
                slidesToShow={Math.min(3, partnerAnalytics.topPartners.length)}
                slidesToScroll={1}
                responsive={[
                  {
                    breakpoint: 1280,
                    settings: { slidesToShow: Math.min(2, partnerAnalytics.topPartners.length) || 1 },
                  },
                  {
                    breakpoint: 768,
                    settings: { slidesToShow: 1 },
                  },
                ]}
              >
                {partnerAnalytics.topPartners.map((partner, index) => (
                  <div key={partner.key} className="adm-partner-spotlight-slide">
                    <div className="adm-partner-spotlight-card">
                      <div className="adm-partner-spotlight-rank">#{index + 1}</div>
                      <div className="adm-partner-spotlight-head">
                        <div>
                          <h4>{partner.name}</h4>
                          <p>{partner.shop}</p>
                        </div>
                        <Tag color={partner.activityState.color}>{partner.activityState.label}</Tag>
                      </div>
                      <div className="adm-partner-spotlight-stats">
                        <div>
                          <strong>{partner.joins}</strong>
                          <span>Attributed Users</span>
                        </div>
                        <div>
                          <strong>{partner.downstreamScans}</strong>
                          <span>Network Scans</span>
                        </div>
                        <div>
                          <strong>{formatMoney(partner.totalRevenue)}</strong>
                          <span>Tracked Revenue</span>
                        </div>
                      </div>
                      <div className="adm-partner-spotlight-meta">
                        <span>QR {partner.qrJoins}</span>
                        <span>Code {partner.codeJoins}</span>
                        <span>Last join {formatDate(partner.latestJoinAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
            )}
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={14}>
              <Card title={<><LinkOutlined /> Acquisition Source Breakdown</>} size="small" className="adm-chart-card">
                <div className="adm-partner-source-grid">
                  <div className="adm-partner-source-card is-qr">
                    <span>Joined Via Partner QR</span>
                    <strong>{partnerAnalytics.totalQrJoins}</strong>
                    <p>Automatic attribution from partner QR links</p>
                  </div>
                  <div className="adm-partner-source-card is-code">
                    <span>Joined Via Referral Code</span>
                    <strong>{partnerAnalytics.totalCodeJoins}</strong>
                    <p>Manual partner code entry during registration</p>
                  </div>
                  <div className="adm-partner-source-card is-legacy">
                    <span>Legacy Attribution</span>
                    <strong>{partnerAnalytics.totalLegacyJoins}</strong>
                    <p>Older partner joins without explicit source tracking</p>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} xl={10}>
              <Card title={<><BarChartOutlined /> Top Cities By Partner Joins</>} size="small" className="adm-chart-card">
                {partnerAnalytics.topCities.length === 0 ? (
                  <Empty description="No city data yet" />
                ) : (
                  <div className="adm-partner-city-list">
                    {partnerAnalytics.topCities.map((city) => (
                      <div key={city.city} className="adm-partner-city-row">
                        <div>
                          <strong>{city.city}</strong>
                          <span>{city.state}</span>
                        </div>
                        <div>
                          <strong>{city.joins}</strong>
                          <span>{city.partners} partners</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeView === 'activity' && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {[
              ['pro', ACTIVITY_META.pro],
              ['active', ACTIVITY_META.active],
              ['low', ACTIVITY_META.low],
              ['almost', ACTIVITY_META.almost],
              ['inactive', ACTIVITY_META.inactive],
            ].map(([key, meta]) => (
              <Col xs={12} md={8} xl={4} key={key}>
                <Card
                  size="small"
                  className={`adm-kpi-card adm-chart-card adm-partner-state-card ${activityFilter === key ? 'is-selected' : ''}`}
                  onClick={() => setActivityFilter((prev) => (prev === key ? 'all' : key))}
                  style={{ cursor: 'pointer' }}
                >
                  <p>{meta.label}</p>
                  <h3 style={{ color: meta.accent }}>{partnerAnalytics.countsByState[key] || 0}</h3>
                  <span>{meta.helper}</span>
                </Card>
              </Col>
            ))}
            <Col xs={12} md={8} xl={4}>
              <Card
                size="small"
                className={`adm-kpi-card adm-chart-card adm-partner-state-card ${activityFilter === 'all' ? 'is-selected' : ''}`}
                onClick={() => setActivityFilter('all')}
                style={{ cursor: 'pointer' }}
              >
                <p>All Activity</p>
                <h3 style={{ color: 'var(--accent)' }}>{partnerAnalytics.rows.length}</h3>
                <span>Reset activity filters</span>
              </Card>
            </Col>
          </Row>

          <div className="adm-partner-activity-toolbar">
            <div className="adm-partner-activity-filter">
              <label htmlFor="partner-activity-filter">Sort By Status</label>
              <select
                id="partner-activity-filter"
                className="adm-field-input"
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pro">Pro Active</option>
                <option value="active">Active</option>
                <option value="low">Low Active</option>
                <option value="almost">Almost Inactive</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="adm-table-wrap adm-partner-activity-wrap adm-desktop-only">
            <table className="adm-table adm-partner-activity-table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Status</th>
                  <th>Network Scans</th>
                  <th>Revenue</th>
                  <th>Last Join</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartnerRows.map((partner) => (
                  <tr key={partner.key}>
                    <td>
                      <div className="adm-partner-activity-primary">
                        <strong>{partner.name}</strong>
                        <span>{partner.code} · {partner.shop}</span>
                      </div>
                    </td>
                    <td><Tag color={partner.activityState.color}>{partner.activityState.label}</Tag></td>
                    <td>{partner.downstreamScans}</td>
                    <td>{formatMoney(partner.totalRevenue)}</td>
                    <td>{formatDate(partner.latestJoinAt, true)}</td>
                    <td>{renderActionButtons(partner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPartnerRows.length === 0 && <p className="adm-empty">No partner activity matched these filters</p>}
          </div>

          <div className="adm-card-list adm-mobile-only">
            {filteredPartnerRows.map((partner) => (
              <div key={partner.key} className="adm-card">
                <div className="adm-card-row adm-card-row-between">
                  <span className="adm-card-name">{partner.name}</span>
                  <Tag color={partner.activityState.color}>{partner.activityState.label}</Tag>
                </div>
                <div className="adm-card-row">
                  <span className="adm-card-sub">{partner.code}</span>
                  <span className="adm-card-sub">{partner.shop}</span>
                </div>
                <div className="adm-partner-stats">
                  <div className="adm-partner-stat">
                    <span className="adm-partner-stat-value">{partner.downstreamScans}</span>
                    <span className="adm-partner-stat-label">Scans</span>
                  </div>
                  <div className="adm-partner-stat">
                    <span className="adm-partner-stat-value">{formatMoney(partner.totalRevenue)}</span>
                    <span className="adm-partner-stat-label">Revenue</span>
                  </div>
                </div>
                <div className="adm-card-row">
                  <span className="adm-card-sub">{partner.activityState.label}</span>
                  <span className="adm-card-sub">{formatDate(partner.latestJoinAt)}</span>
                </div>
                <div className="adm-card-actions">
                  <button className="adm-action-btn" onClick={() => setViewingPartner(partner)}>👥 View Users</button>
                  <button className="adm-action-btn" onClick={() => setPreviewPartner(partner)}><QrcodeOutlined /> Card</button>
                </div>
              </div>
            ))}
            {filteredPartnerRows.length === 0 && <p className="adm-empty">No partner activity matched these filters</p>}
          </div>
        </>
      )}

      {activeView === 'payments' && (
        <>
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {[
              { label: 'Today Paid', value: paymentLedger.todayPaid, accent: '#22c55e', helper: 'Last 24 hours payouts' },
              { label: 'Weekly Paid', value: paymentLedger.weeklyPaid, accent: '#3b82f6', helper: 'Last 7 days payouts' },
              { label: 'Monthly Paid', value: paymentLedger.monthlyPaid, accent: '#f59e0b', helper: 'Last 30 days payouts' },
              { label: 'Total Pending', value: paymentLedger.totalPending, accent: '#ef4444', helper: 'Pending commission balance' },
            ].map((card) => (
              <Col xs={24} sm={12} xl={6} key={card.label}>
                <Card size="small" className="adm-kpi-card adm-chart-card adm-partner-state-card">
                  <p>{card.label}</p>
                  <h3 style={{ color: card.accent }}>{formatMoney(card.value)}</h3>
                  <span>{card.helper}</span>
                </Card>
              </Col>
            ))}
          </Row>

          <div className="adm-partner-payment-toolbar">
            <div className="adm-partner-payment-filter">
              <label htmlFor="partner-payment-filter">Payment Status</label>
              <select
                id="partner-payment-filter"
                className="adm-field-input"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">All Payments</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial Paid</option>
                <option value="paid">Paid</option>
                <option value="no_earning">No Earning</option>
              </select>
            </div>
          </div>

          <div className="adm-table-wrap adm-partner-payment-wrap adm-desktop-only">
            <table className="adm-table adm-partner-payment-table">
              <thead>
                <tr>
                  <th>Partner Name / ID</th>
                  <th>Total Earned</th>
                  <th>Amount Paid</th>
                  <th>Pending Balance</th>
                  <th>Payment Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPaymentRows.map((partner) => (
                  <tr key={partner.key}>
                    <td>
                      <div className="adm-partner-activity-primary">
                        <strong>{partner.name}</strong>
                        <span>{partner.shop} ({partner.code})</span>
                      </div>
                    </td>
                    <td>{formatMoney(partner.totalEarned)}</td>
                    <td style={{ color: 'var(--green)' }}>{formatMoney(partner.amountPaid)}</td>
                    <td style={{ color: partner.pendingBalance > 0 ? 'var(--red)' : 'var(--text-dim)' }}>
                      {formatMoney(partner.pendingBalance)}
                    </td>
                    <td><Tag color={partner.paymentStatus.color}>{partner.paymentStatus.label}</Tag></td>
                    <td>
                      {partner.totalEarned <= 0 ? (
                        <span className="adm-partner-payment-empty">No earning</span>
                      ) : partner.pendingBalance > 0 ? (
                        <button
                          className="adm-action-btn adm-action-green"
                          onClick={() => openPaymentModal(partner)}
                        >
                          <CreditCardOutlined /> Pay
                        </button>
                      ) : (
                        <Tag color="green">Settled</Tag>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPaymentRows.length === 0 && <p className="adm-empty">No payment rows matched your filters</p>}
          </div>

          <div className="adm-card-list adm-mobile-only">
            {filteredPaymentRows.map((partner) => (
              <div key={partner.key} className="adm-card">
                <div className="adm-card-row adm-card-row-between">
                  <span className="adm-card-name">{partner.name}</span>
                  <Tag color={partner.paymentStatus.color}>{partner.paymentStatus.label}</Tag>
                </div>
                <div className="adm-card-row">
                  <span className="adm-card-sub">{partner.shop}</span>
                  <span className="adm-card-sub">{partner.code}</span>
                </div>

                <div className="adm-partner-stats">
                  <div className="adm-partner-stat">
                    <span className="adm-partner-stat-value">{formatMoney(partner.totalEarned)}</span>
                    <span className="adm-partner-stat-label">Earned</span>
                  </div>
                  <div className="adm-partner-stat">
                    <span className="adm-partner-stat-value" style={{ color: 'var(--green)' }}>{formatMoney(partner.amountPaid)}</span>
                    <span className="adm-partner-stat-label">Paid</span>
                  </div>
                  <div className="adm-partner-stat">
                    <span className="adm-partner-stat-value" style={{ color: partner.pendingBalance > 0 ? 'var(--red)' : 'var(--text-dim)' }}>
                      {formatMoney(partner.pendingBalance)}
                    </span>
                    <span className="adm-partner-stat-label">Pending</span>
                  </div>
                  <div className="adm-partner-stat">
                    <span className="adm-partner-stat-value">{formatMoney(partner.commissionRate)}</span>
                    <span className="adm-partner-stat-label">Per Sale</span>
                  </div>
                </div>

                <div className="adm-card-actions">
                  {partner.totalEarned > 0 && partner.pendingBalance > 0 && (
                    <button
                      className="adm-action-btn adm-action-green"
                      onClick={() => openPaymentModal(partner)}
                    >
                      <CreditCardOutlined /> Pay Partner
                    </button>
                  )}
                  {partner.totalEarned > 0 && partner.pendingBalance <= 0 && (
                    <span className="adm-partner-payment-empty">Fully settled</span>
                  )}
                  {partner.totalEarned <= 0 && (
                    <span className="adm-partner-payment-empty">No earning yet</span>
                  )}
                </div>
              </div>
            ))}
            {filteredPaymentRows.length === 0 && <p className="adm-empty">No payment rows matched your filters</p>}
          </div>
        </>
      )}

      {activeView === 'directory' && (
        <>
          <div className="adm-table-wrap adm-partner-table-wrap adm-desktop-only">
            <table className="adm-table adm-table-fixed adm-partner-table">
              <thead>
                <tr>
                  <th className="adm-sticky-left adm-sticky-left-1">Partner</th>
                  <th className="adm-sticky-left adm-sticky-left-2">Shop</th>
                  <th>Type</th>
                  <th>Code</th>
                  <th>Mobile</th>
                  <th>Users</th>
                  <th>Revenue</th>
                  <th>Pending ₹</th>
                  <th>Status</th>
                  <th className="adm-sticky-right adm-sticky-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartnerRows.map((partner) => (
                  <tr key={partner.key} className={partner.status !== 'active' ? 'adm-row-suspended' : ''}>
                    <td className="adm-td-name adm-sticky-left adm-sticky-left-1" data-tooltip={partner.name}>{partner.name}</td>
                    <td className="adm-sticky-left adm-sticky-left-2" data-tooltip={partner.shop || '—'}>{partner.shop || '—'}</td>
                    <td data-tooltip={partner.type || '—'}>{partner.type || '—'}</td>
                    <td className="adm-td-vehicle" data-tooltip={partner.code}>{partner.code}</td>
                    <td data-tooltip={partner.mobile || '—'}>{partner.mobile || '—'}</td>
                    <td>{partner.joins}</td>
                    <td>{formatMoney(partner.totalRevenue)}</td>
                    <td style={{ color: safeNumber(paymentLedger.byKey.get(partner.key)?.pendingBalance) > 0 ? 'var(--accent)' : 'var(--text-dim)' }}>
                      {formatMoney(paymentLedger.byKey.get(partner.key)?.pendingBalance)}
                    </td>
                    <td><Tag color={partner.status === 'active' ? 'green' : 'red'}>{partner.status}</Tag></td>
                    <td className="adm-sticky-right adm-sticky-actions">{renderActionButtons(partner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPartnerRows.length === 0 && <p className="adm-empty">No partners matched your search</p>}
          </div>

          <div className="adm-card-list adm-mobile-only">
            {filteredPartnerRows.map((partner) => (
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
                    <span className="adm-partner-stat-value">{partner.joins}</span>
                    <span className="adm-partner-stat-label">Users</span>
                  </div>
                  <div className="adm-partner-stat">
                    <span className="adm-partner-stat-value">{formatMoney(partner.totalRevenue)}</span>
                    <span className="adm-partner-stat-label">Revenue</span>
                  </div>
                  <div className="adm-partner-stat">
                    <span className="adm-partner-stat-value">{partner.qrJoins}</span>
                    <span className="adm-partner-stat-label">QR</span>
                  </div>
                  <div className="adm-partner-stat">
                    <span className="adm-partner-stat-value" style={{ color: safeNumber(paymentLedger.byKey.get(partner.key)?.pendingBalance) > 0 ? 'var(--accent)' : 'var(--text-dim)' }}>
                      {formatMoney(paymentLedger.byKey.get(partner.key)?.pendingBalance)}
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
                  {safeNumber(paymentLedger.byKey.get(partner.key)?.pendingBalance) > 0 && (
                    <button className="adm-action-btn adm-action-green" onClick={() => openPaymentModal(paymentLedger.byKey.get(partner.key))}>
                      <CreditCardOutlined /> Pay
                    </button>
                  )}
                  <button className="adm-action-btn" onClick={() => setPreviewPartner(partner)}>
                    <QrcodeOutlined /> Partner Card
                  </button>
                  <button className="adm-action-btn" onClick={() => setViewingPartner(partner)}>
                    👥 View Users
                  </button>
                </div>
              </div>
            ))}
            {filteredPartnerRows.length === 0 && <p className="adm-empty">No partners matched your search</p>}
          </div>
        </>
      )}

      {showFormModal && createPortal(
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
                  <label className='adm-field-label'>Shop Type (C) *</label>
                  <select
                    className="adm-field bg-black text-white p-2 rounded-lg"
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
                  <strong>Partner code preview:</strong>{' '}
                  {editingPartner?.code || (partnerForm.type ? generatePartnerCode(partnerForm.type, partners, editingPartner?.key) : 'Select shop type first')}
                </div>

                <button type="submit" className="adm-add-btn text-white bg-zinc-500 adm-partner-form-full adm-partner-submit" disabled={savingPartner}>
                  {savingPartner ? 'Saving...' : (editingPartner ? 'Update & Preview Card' : 'Submit & Generate Code')}
                </button>
                <button type="button" className="adm-partner-cancel adm-partner-form-full" onClick={closeFormModal}>
                  Close
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {previewPartner && createPortal(
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
                  <span>Commission: {formatMoney(previewPartner.comm)}</span>
                </div>
              </div>

              <div className="adm-partner-preview-info">
                <div className="adm-partner-code-box">
                  <span>Partner Code</span>
                  <strong>{previewPartner.code}</strong>
                  <button type="button" onClick={() => handleCopyCode(previewPartner.code)}><CopyOutlined /> Copy</button>
                </div>
                <p>Share this QR card or code during Rakshak onboarding. Users who join through this QR link are tracked as QR-sourced partner registrations.</p>
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
        </div>,
        document.body
      )}

      <Drawer
        title={<><CreditCardOutlined /> Payment Receipt</>}
        placement="left"
        width={480}
        onClose={closePaymentModal}
        open={Boolean(paymentPartnerData)}
        destroyOnClose
        rootClassName="adm-partner-payment-drawer-root"
        className="adm-partner-payment-drawer"
        footer={(
          <div className="adm-partner-payment-actions">
            <button className="adm-add-btn" onClick={handleSavePayment} disabled={savingPayment}>
              {savingPayment ? 'Saving...' : 'Done & Save'}
            </button>
            <button className="adm-partner-cancel" onClick={closePaymentModal} disabled={savingPayment}>
              Cancel
            </button>
          </div>
        )}
      >
        {paymentPartnerData && (
          <div className="adm-partner-payment-sheet">
            <div className="adm-partner-payment-hero">
              <span className="adm-partner-payment-kicker">Partner Payout</span>
              <h3>{paymentPartnerData.name}</h3>
              <p>{paymentPartnerData.shop} · {paymentPartnerData.code}</p>
            </div>

            <div className="adm-partner-payment-metrics">
              <div className="adm-partner-payment-metric">
                <span>Payment Date</span>
                <strong>{formatDate(new Date().toISOString(), true)}</strong>
              </div>
              <div className="adm-partner-payment-metric">
                <span>Total Earned</span>
                <strong>{formatMoney(paymentPartnerData.totalEarned)}</strong>
              </div>
              <div className="adm-partner-payment-metric">
                <span>Already Paid</span>
                <strong>{formatMoney(paymentPartnerData.amountPaid)}</strong>
              </div>
              <div className="adm-partner-payment-metric is-highlight">
                <span>Pending Balance</span>
                <strong>{formatMoney(paymentPartnerData.pendingBalance)}</strong>
              </div>
            </div>

            <div className="adm-partner-payment-grid">
              <div className="adm-field adm-partner-form-full">
                <label>Amount to Pay (₹) *</label>
                <input
                  className="adm-field-input"
                  type="number"
                  min="1"
                  max={paymentPartnerData.pendingBalance}
                  placeholder="Enter amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="adm-field adm-partner-form-full">
                <label>Transaction ID / Ref No. *</label>
                <input
                  className="adm-field-input"
                  placeholder="Enter TRX ID"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, transactionId: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {viewingPartnerData && createPortal(
        <div className="adm-modal-overlay" onClick={() => setViewingPartner(null)}>
          <div className="adm-modal adm-partner-activity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h4 className="adm-modal-title">👥 Partner Activity — {viewingPartnerData.name} ({viewingPartnerData.code})</h4>
              <button className="adm-modal-close" onClick={() => setViewingPartner(null)}>✕</button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-partner-modal-summary">
                <div>
                  <span>Attributed Users</span>
                  <strong>{viewingPartnerData.joins}</strong>
                </div>
                <div>
                  <span>Joined Via QR</span>
                  <strong>{viewingPartnerData.qrJoins}</strong>
                </div>
                <div>
                  <span>Joined Via Code</span>
                  <strong>{viewingPartnerData.codeJoins}</strong>
                </div>
                <div>
                  <span>Network Scans</span>
                  <strong>{viewingPartnerData.downstreamScans}</strong>
                </div>
              </div>

              {viewingPartnerData.attributedCustomers.length === 0 ? (
                <p className="adm-empty">No attributed users found for this partner yet.</p>
              ) : (
                <div className="adm-partner-customer-list">
                  {viewingPartnerData.attributedCustomers.map((customer) => (
                    <div key={customer.key} className="adm-partner-customer-card">
                      <div className="adm-partner-customer-head">
                        <div>
                          <strong>{customer.name}</strong>
                          <span>{customer.vehicle || '—'} · {customer.mobile || '—'}</span>
                        </div>
                        <Tag color={
                          customer.joinSource === 'partner_qr'
                            ? 'green'
                            : customer.joinSource === 'partner_code'
                              ? 'blue'
                              : 'default'
                        }>
                          {customer.joinSource === 'partner_qr'
                            ? 'Joined via QR'
                            : customer.joinSource === 'partner_code'
                              ? 'Joined via Code'
                              : 'Legacy Attribution'}
                        </Tag>
                      </div>
                      <div className="adm-partner-customer-meta">
                        <span>{formatMoney(customer.amount)}</span>
                        <span>{customer.scanCount} scans</span>
                        <span>{formatDate(customer.timestamp, true)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default PartnerManagement
