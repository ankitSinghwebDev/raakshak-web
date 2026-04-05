import * as XLSX from 'xlsx'
import { db, ref, get } from '../config/firebase'

const formatDate = (ts) => {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const shortDate = (ts) => {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('en-IN')
}

export const exportAllData = async () => {
  const wb = XLSX.utils.book_new()

  // ─── 1. CUSTOMERS ───
  const custSnap = await get(ref(db, 'customers'))
  const customers = []
  if (custSnap.exists()) {
    Object.entries(custSnap.val()).forEach(([key, c]) => {
      customers.push({
        'Rakshak ID': c.generatedId || '—',
        'Name': c.name || '—',
        'Vehicle Number': c.vehicle || '—',
        'Mobile': c.mobile || '—',
        'WhatsApp': c.whatsapp || c.mobile || '—',
        'Plan': c.plan || '—',
        'Amount (₹)': parseInt(c.amount) || 0,
        'Payment ID': c.paymentId || '—',
        'Coupon Used': c.coupon || '—',
        'Status': c.status || 'Paid',
        'Total Scans': c.totalScans || 0,
        'Emergency Contact 1': c.emergency?.iceContact1 || '—',
        'Emergency Relation': c.emergency?.relation1 || '—',
        'Emergency Contact 2': c.emergency?.iceContact2 || '—',
        'Blood Group': c.emergency?.bloodGroup || '—',
        'Age': c.emergency?.age || '—',
        'Medical Conditions': c.emergency?.conditions?.join(', ') || '—',
        'Medicines': c.emergency?.medicines || '—',
        'QR Link': c.qrLink || '—',
        'Registered On': formatDate(c.timestamp),
        'Firebase Key': key,
      })
    })
  }
  customers.sort((a, b) => new Date(b['Registered On']) - new Date(a['Registered On']))
  const custWs = XLSX.utils.json_to_sheet(customers.length ? customers : [{ 'No Data': 'No customers found' }])
  setColWidths(custWs, customers)
  XLSX.utils.book_append_sheet(wb, custWs, 'Customers')

  // ─── 2. SCANS ───
  const scanSnap = await get(ref(db, 'scans'))
  const custMap = {}
  if (custSnap.exists()) {
    Object.entries(custSnap.val()).forEach(([key, c]) => {
      custMap[key] = { name: c.name, vehicle: c.vehicle, mobile: c.mobile }
    })
  }
  const scans = []
  if (scanSnap.exists()) {
    Object.entries(scanSnap.val()).forEach(([custKey, userScans]) => {
      const cust = custMap[custKey] || {}
      Object.entries(userScans).forEach(([scanKey, s]) => {
        scans.push({
          'Date & Time': formatDate(s.timestamp),
          'Vehicle': cust.vehicle || '—',
          'Owner Name': cust.name || '—',
          'Owner Mobile': cust.mobile || '—',
          'Scan Type': (s.type || 'parking').toUpperCase(),
          'Message': s.message || '—',
          'Scanner Name': s.scannerName || '—',
          'Scanner Mobile': s.scannerMobile || '—',
          'Device Fingerprint': s.deviceFingerprint || '—',
          'Scan ID': scanKey,
        })
      })
    })
  }
  scans.sort((a, b) => new Date(b['Date & Time']) - new Date(a['Date & Time']))
  const scanWs = XLSX.utils.json_to_sheet(scans.length ? scans : [{ 'No Data': 'No scans found' }])
  setColWidths(scanWs, scans)
  XLSX.utils.book_append_sheet(wb, scanWs, 'Scan Logs')

  // ─── 3. PARTNERS ───
  const partnerSnap = await get(ref(db, 'partners'))
  const partners = []
  if (partnerSnap.exists()) {
    Object.entries(partnerSnap.val()).forEach(([key, p]) => {
      partners.push({
        'Partner Name': p.name || '—',
        'Shop Name': p.shop || '—',
        'Shop Type': p.type || '—',
        'Partner Code': p.code || '—',
        'Mobile': p.mobile || '—',
        'Address': p.address || '—',
        'City': p.city || '—',
        'State': p.state || '—',
        'Pin Code': p.pin || '—',
        'Status': (p.status || 'active').toUpperCase(),
        'Commission Amount (₹)': p.comm || 0,
        'Total Sales': p.totalSales || 0,
        'Total Revenue (₹)': p.totalRevenue || 0,
        'Pending Commission (₹)': p.pendingComm || 0,
        'Last Paid': p.lastPaidAt ? shortDate(p.lastPaidAt) : '—',
        'Created On': formatDate(p.createdAt),
        'Firebase Key': key,
      })
    })
  }
  const partnerWs = XLSX.utils.json_to_sheet(partners.length ? partners : [{ 'No Data': 'No partners found' }])
  setColWidths(partnerWs, partners)
  XLSX.utils.book_append_sheet(wb, partnerWs, 'Partners')

  // ─── 4. SUPPORT MESSAGES ───
  const supportSnap = await get(ref(db, 'support'))
  const supportMsgs = []
  if (supportSnap.exists()) {
    Object.entries(supportSnap.val()).forEach(([custKey, msgs]) => {
      const cust = custMap[custKey] || {}
      Object.values(msgs)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .forEach((msg) => {
          supportMsgs.push({
            'Customer': cust.name || msg.name || '—',
            'Vehicle': cust.vehicle || msg.vehicle || '—',
            'Sender': (msg.sender || 'user').toUpperCase(),
            'Message': msg.text || '—',
            'Date & Time': formatDate(msg.timestamp),
            'Customer Key': custKey,
          })
        })
    })
  }
  supportMsgs.sort((a, b) => new Date(b['Date & Time']) - new Date(a['Date & Time']))
  const supportWs = XLSX.utils.json_to_sheet(supportMsgs.length ? supportMsgs : [{ 'No Data': 'No support messages found' }])
  setColWidths(supportWs, supportMsgs)
  XLSX.utils.book_append_sheet(wb, supportWs, 'Support Messages')

  // ─── 5. SUMMARY SHEET ───
  const today = new Date().toISOString().split('T')[0]
  let todayRegs = 0, todayRev = 0, todayScans = 0
  customers.forEach((c) => {
    if (c['Registered On']?.includes(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }))) {
      todayRegs++
      todayRev += c['Amount (₹)']
    }
  })
  scans.forEach((s) => {
    if (s['Date & Time']?.includes(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }))) {
      todayScans++
    }
  })

  const summary = [
    { 'Metric': 'Report Generated', 'Value': new Date().toLocaleString('en-IN') },
    { 'Metric': '', 'Value': '' },
    { 'Metric': 'CUSTOMERS', 'Value': '' },
    { 'Metric': 'Total Customers', 'Value': customers.length },
    { 'Metric': 'Today Registrations', 'Value': todayRegs },
    { 'Metric': 'Lite Plan Users', 'Value': customers.filter(c => c.Plan === 'Lite Plan').length },
    { 'Metric': 'Premium Plan Users', 'Value': customers.filter(c => c.Plan !== 'Lite Plan').length },
    { 'Metric': 'Suspended Accounts', 'Value': customers.filter(c => c.Status === 'Suspended').length },
    { 'Metric': '', 'Value': '' },
    { 'Metric': 'REVENUE', 'Value': '' },
    { 'Metric': 'Total Revenue (₹)', 'Value': customers.reduce((sum, c) => sum + (c['Amount (₹)'] || 0), 0) },
    { 'Metric': 'Today Revenue (₹)', 'Value': todayRev },
    { 'Metric': 'Average Revenue Per Customer (₹)', 'Value': customers.length ? Math.round(customers.reduce((sum, c) => sum + (c['Amount (₹)'] || 0), 0) / customers.length) : 0 },
    { 'Metric': '', 'Value': '' },
    { 'Metric': 'SCANS', 'Value': '' },
    { 'Metric': 'Total Scans', 'Value': scans.length },
    { 'Metric': 'Today Scans', 'Value': todayScans },
    { 'Metric': 'Parking Scans', 'Value': scans.filter(s => s['Scan Type'] === 'PARKING').length },
    { 'Metric': 'Urgent Scans', 'Value': scans.filter(s => s['Scan Type'] === 'URGENT').length },
    { 'Metric': 'Emergency Scans', 'Value': scans.filter(s => s['Scan Type'] === 'EMERGENCY').length },
    { 'Metric': '', 'Value': '' },
    { 'Metric': 'PARTNERS', 'Value': '' },
    { 'Metric': 'Total Partners', 'Value': partners.length },
    { 'Metric': 'Active Partners', 'Value': partners.filter(p => p.Status === 'ACTIVE').length },
    { 'Metric': 'Total Partner Revenue (₹)', 'Value': partners.reduce((sum, p) => sum + (p['Total Revenue (₹)'] || 0), 0) },
    { 'Metric': 'Total Pending Commission (₹)', 'Value': partners.reduce((sum, p) => sum + (p['Pending Commission (₹)'] || 0), 0) },
    { 'Metric': '', 'Value': '' },
    { 'Metric': 'SUPPORT', 'Value': '' },
    { 'Metric': 'Total Support Threads', 'Value': supportSnap.exists() ? Object.keys(supportSnap.val()).length : 0 },
    { 'Metric': 'Total Messages', 'Value': supportMsgs.length },
  ]
  const summaryWs = XLSX.utils.json_to_sheet(summary)
  summaryWs['!cols'] = [{ wch: 35 }, { wch: 25 }]
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

  // Move Summary to first position
  const sheetOrder = wb.SheetNames
  const summaryIdx = sheetOrder.indexOf('Summary')
  sheetOrder.splice(summaryIdx, 1)
  sheetOrder.unshift('Summary')
  wb.SheetNames = sheetOrder

  // ─── DOWNLOAD ───
  const dateStr = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `Rakshak_Admin_Data_${dateStr}.xlsx`)
}

// Auto-set column widths based on content
function setColWidths(ws, data) {
  if (!data.length) return
  const keys = Object.keys(data[0])
  ws['!cols'] = keys.map((key) => {
    let maxLen = key.length
    data.forEach((row) => {
      const val = String(row[key] || '')
      if (val.length > maxLen) maxLen = val.length
    })
    return { wch: Math.min(maxLen + 2, 40) }
  })
}
