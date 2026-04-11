import Tesseract from 'tesseract.js'

// Document types where OCR-based expiry extraction is worth running
export const OCR_ELIGIBLE_DOCS = new Set(['dl', 'puc', 'insurance', 'rc'])

// Doc-type-specific keywords (searched FIRST, in order)
const KEYWORDS_BY_DOC = {
  rc: [
    'fitness valid upto',
    'fitness valid up to',
    'fitness valid',
    'registration valid',
    'rc valid',
  ],
  dl: [
    'valid till',
    'valid upto',
    'valid up to',
    'dl valid',
    'licence valid',
    'license valid',
  ],
  insurance: [
    'insurance valid upto',
    'insurance valid up to',
    'insurance valid',
    'policy expiry',
    'policy valid',
    'expiry date',
  ],
  puc: [
    'pucc valid upto',
    'pucc valid up to',
    'puc valid upto',
    'puc valid up to',
    'pucc valid',
    'puc valid',
    'emission valid',
  ],
}

// Generic fallback keywords (only used if no doc-type match)
const FALLBACK_KEYWORDS = [
  'valid till',
  'valid upto',
  'valid up to',
  'expiry date',
  'expires on',
  'expires',
  'valid until',
  'expiry',
]

const MONTH_MAP = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
}

const pad = (n) => String(n).padStart(2, '0')

const toIsoDate = (day, month, year) => {
  if (!day || !month || !year) return null
  const d = Number(day)
  const m = Number(month)
  let y = Number(year)
  if (y < 100) y += 2000
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2000 || y > 2100) return null
  return `${y}-${pad(m)}-${pad(d)}`
}

// Match DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD MM YYYY
const NUMERIC_DATE = /(\d{1,2})[\s/.\-](\d{1,2})[\s/.\-](\d{2,4})/g

// Match DD Mon YYYY (e.g. 15 Jan 2026, 15-Jan-2026)
const TEXT_DATE = /(\d{1,2})[\s/.\-]+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*[\s/.\-]+(\d{2,4})/gi

const findDateNearKeyword = (text, keyword) => {
  const idx = text.indexOf(keyword)
  if (idx === -1) return null
  const window = text.slice(idx, idx + keyword.length + 50)

  const textMatch = Array.from(window.matchAll(TEXT_DATE))[0]
  if (textMatch) {
    const iso = toIsoDate(textMatch[1], MONTH_MAP[textMatch[2].toLowerCase()], textMatch[3])
    if (iso) return iso
  }

  const numMatch = Array.from(window.matchAll(NUMERIC_DATE))[0]
  if (numMatch) {
    const iso = toIsoDate(numMatch[1], numMatch[2], numMatch[3])
    if (iso) return iso
  }
  return null
}

/**
 * Extract an ISO-formatted expiry date from raw OCR text.
 * Strategy:
 *   1. Doc-type-specific keywords (e.g. "insurance valid upto" for insurance)
 *   2. Generic fallback keywords
 *   3. Latest future date anywhere in the text
 */
export const extractExpiryDate = (rawText, docKey = null) => {
  if (!rawText) return null
  const text = rawText.toLowerCase().replace(/\s+/g, ' ')

  // Strategy 1: doc-type-specific keywords (priority)
  const docKeywords = (docKey && KEYWORDS_BY_DOC[docKey]) || []
  for (const keyword of docKeywords) {
    const iso = findDateNearKeyword(text, keyword)
    if (iso) return iso
  }

  // Strategy 2: generic fallback keywords
  for (const keyword of FALLBACK_KEYWORDS) {
    const iso = findDateNearKeyword(text, keyword)
    if (iso) return iso
  }

  // Strategy 3: latest future date anywhere in the text
  const candidates = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const m of text.matchAll(TEXT_DATE)) {
    const iso = toIsoDate(m[1], MONTH_MAP[m[2].toLowerCase()], m[3])
    if (iso) candidates.push(iso)
  }
  for (const m of text.matchAll(NUMERIC_DATE)) {
    const iso = toIsoDate(m[1], m[2], m[3])
    if (iso) candidates.push(iso)
  }

  const future = candidates
    .filter((iso) => new Date(iso) > today)
    .sort()

  return future[future.length - 1] || null
}

/**
 * Run OCR on an image file. Returns { rawText, expiryDate } or null.
 * onProgress receives a 0-100 integer.
 * docKey hints which keywords to prioritize (e.g. 'insurance' → "insurance valid upto").
 */
export const ocrImageForExpiry = async (file, onProgress, docKey = null) => {
  if (!file || !file.type.startsWith('image/')) return null

  const result = await Tesseract.recognize(file, 'eng', {
    logger: (info) => {
      if (info.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(info.progress * 100))
      }
    },
  })

  const rawText = result?.data?.text || ''
  const expiryDate = extractExpiryDate(rawText, docKey)
  return { rawText, expiryDate }
}
