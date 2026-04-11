import Tesseract from 'tesseract.js'

// Document types where OCR-based expiry extraction is worth running
export const OCR_ELIGIBLE_DOCS = new Set(['dl', 'puc', 'insurance', 'rc'])

const DOC_KEYWORDS = {
  rc: [
    'fitness valid upto',
    'fitness valid up to',
    'fitness valid till',
    'fitness valid until',
    'fitness valid',
    'registration valid',
    'rc valid',
    'validity upto',
  ],
  dl: [
    'dl valid',
    'driving licence valid',
    'driving license valid',
    'licence valid',
    'license valid',
    'valid till',
    'valid upto',
    'valid up to',
    'valid until',
  ],
  insurance: [
    'insurance valid upto',
    'insurance valid up to',
    'insurance valid till',
    'insurance valid until',
    'insurance valid',
    'policy expiry',
    'policy end date',
    'coverage end date',
    'policy valid',
    'card expiry',
    'member valid till',
  ],
  puc: [
    'pucc valid upto',
    'pucc valid up to',
    'puc valid upto',
    'puc valid up to',
    'puc valid till',
    'pucc valid till',
    'puc valid until',
    'pucc valid until',
    'pucc valid',
    'puc valid',
    'emission valid',
  ],
}

const COMMON_KEYWORDS = [
  'expiry date',
  'expiration date',
  'exp date',
  'exp. date',
  'expiry',
  'expiration',
  'exp',
  'valid upto',
  'valid till',
  'valid until',
  'valid thru',
  'validity',
  'validity upto',
  'validity period',
  'policy expiry',
  'policy end date',
  'coverage end date',
  'card expiry',
  'member valid till',
  'expdate',
  'expdt',
  'expdt.',
  'exp:',
  'expirydt',
  'validupto',
  'expires on',
  'expires',
]

const MONTH_MAP = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

const MONTH_PATTERN = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?'
const DAY_MS = 1000 * 60 * 60 * 24

const FULL_NUMERIC_DATE = /\b([0-9OIlSB]{1,2})[\/.\- ]([0-9OIlSB]{1,2})[\/.\- ]('?[\dOIlSB]{2,4})\b/g
const MONTH_YEAR_DATE = /\b(0?[1-9]|1[0-2])[\/\-]('?[\dOIlSB]{2,4})\b(?![\/.\- ]\d)/g
const TEXT_DMY_DATE = new RegExp(`\\b([0-9]{1,2})(?:st|nd|rd|th)?[\\s.\\-/]+(${MONTH_PATTERN})[\\s,'-]*([0-9]{2,4})\\b`, 'gi')
const TEXT_MDY_DATE = new RegExp(`\\b(${MONTH_PATTERN})[\\s.\\-/]+([0-9]{1,2})(?:st|nd|rd|th)?(?:,\\s*|[\\s.\\-/]+)'?([0-9]{2,4})\\b`, 'gi')
const TEXT_MONTH_YEAR_DATE = new RegExp(`\\b(${MONTH_PATTERN})(?:\\s*'\\s*([0-9]{2})|\\s+([0-9]{4}))\\b`, 'gi')
const COMPACT_EIGHT_DIGITS = /\b(\d{8})\b/g
const COMPACT_SIX_DIGITS = /\b(\d{6})\b/g

const pad = (n) => String(n).padStart(2, '0')

const unique = (items) => [...new Set(items.filter(Boolean))]

const normalizeYear = (year) => {
  let value = Number(String(year).replace(/'/g, ''))
  if (Number.isNaN(value)) return null
  if (value < 100) value += 2000
  return value
}

const toIsoDate = (day, month, year) => {
  if (!day || !month || !year) return null
  const d = Number(day)
  const m = Number(month)
  const y = Number(year)

  if (
    Number.isNaN(d) ||
    Number.isNaN(m) ||
    Number.isNaN(y) ||
    d < 1 ||
    d > 31 ||
    m < 1 ||
    m > 12 ||
    y < 2000 ||
    y > 2100
  ) {
    return null
  }

  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null
  }

  return `${y}-${pad(m)}-${pad(d)}`
}

const toIsoMonthEnd = (month, year) => {
  const m = Number(month)
  const y = Number(year)
  if (
    Number.isNaN(m) ||
    Number.isNaN(y) ||
    m < 1 ||
    m > 12 ||
    y < 2000 ||
    y > 2100
  ) {
    return null
  }

  const lastDay = new Date(y, m, 0).getDate()
  return `${y}-${pad(m)}-${pad(lastDay)}`
}

const normalizeForAnchor = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/[1|]/g, 'i')
    .replace(/5/g, 's')
    .replace(/8/g, 'b')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

const compactAnchor = (value) => normalizeForAnchor(value).replace(/\s+/g, '')

const normalizeDateNoise = (value) => {
  return String(value || '').replace(/[0-9OIlSB/.\-:' ]{4,}/g, (token) => (
    token
      .replace(/[oO]/g, '0')
      .replace(/[Il|]/g, '1')
      .replace(/[Ss]/g, '5')
      .replace(/B/g, '8')
  ))
}

const levenshteinDistance = (a, b, maxDistance = 2) => {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1

  const prev = Array.from({ length: b.length + 1 }, (_, idx) => idx)

  for (let i = 1; i <= a.length; i += 1) {
    let current = [i]
    let minInRow = current[0]

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const value = Math.min(
        current[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      )
      current[j] = value
      if (value < minInRow) minInRow = value
    }

    if (minInRow > maxDistance) return maxDistance + 1

    for (let j = 0; j < current.length; j += 1) {
      prev[j] = current[j]
    }
  }

  return prev[b.length]
}

const findApproxIndex = (text, keyword) => {
  if (!text || !keyword) return -1
  const maxDistance = keyword.length >= 10 ? 2 : 1
  const minLength = Math.max(1, keyword.length - maxDistance)
  const maxLength = Math.min(text.length, keyword.length + maxDistance)

  for (let length = minLength; length <= maxLength; length += 1) {
    for (let index = 0; index <= text.length - length; index += 1) {
      const window = text.slice(index, index + length)
      if (levenshteinDistance(window, keyword, maxDistance) <= maxDistance) {
        return index
      }
    }
  }

  return -1
}

const exactKeywordIndex = (normalizedText, normalizedKeyword) => {
  if (!normalizedKeyword) return -1

  if (!normalizedKeyword.includes(' ') && normalizedKeyword.length <= 4) {
    const words = normalizedText.split(' ')
    let offset = 0
    for (const word of words) {
      if (word === normalizedKeyword) return offset
      offset += word.length + 1
    }
    return -1
  }

  return normalizedText.indexOf(normalizedKeyword)
}

const findAnchorMatch = (snippet, keywords) => {
  const normalizedText = normalizeForAnchor(snippet)
  const compactText = normalizedText.replace(/\s+/g, '')
  let best = null

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeForAnchor(keyword)
    const compactKeyword = normalizedKeyword.replace(/\s+/g, '')
    if (!compactKeyword) continue

    let mode = null
    let position = exactKeywordIndex(normalizedText, normalizedKeyword)

    if (position !== -1) {
      mode = 'exact'
    } else if (compactText.includes(compactKeyword)) {
      mode = 'compact'
    } else {
      const approxIndex = findApproxIndex(compactText, compactKeyword)
      if (approxIndex !== -1) {
        mode = 'fuzzy'
        position = -1
      }
    }

    if (!mode) continue

    const modeScore = mode === 'exact' ? 20 : mode === 'compact' ? 16 : 12
    const lengthScore = Math.min(8, Math.floor(compactKeyword.length / 2))
    const score = modeScore + lengthScore

    if (!best || score > best.score) {
      best = {
        keyword,
        normalizedKeyword,
        score,
        position,
        mode,
      }
    }
  }

  return best
}

const getDatePreference = (rawText, docKey) => {
  const text = String(rawText || '').toLowerCase()
  if (
    /\busa\b|united states|proof of auto insurance|auto insurance/.test(text)
  ) {
    return 'mdy'
  }
  if (docKey === 'insurance') {
    return 'dmy'
  }
  return 'dmy'
}

const buildSnippets = (rawText) => {
  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const snippets = []
  const seen = new Set()
  const pushSnippet = (text, contextScore) => {
    const clean = text.trim()
    if (!clean) return
    const key = clean.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    snippets.push({ text: clean, contextScore })
  }

  for (let index = 0; index < lines.length; index += 1) {
    pushSnippet(lines[index], 10)
    if (lines[index + 1]) pushSnippet(`${lines[index]} ${lines[index + 1]}`, 8)
    if (lines[index + 2]) pushSnippet(`${lines[index]} ${lines[index + 1]} ${lines[index + 2]}`, 6)
  }

  pushSnippet(lines.join(' '), 2)

  return snippets
}

const resolveNumericCandidates = (firstToken, secondToken, yearToken, options = {}) => {
  const first = Number(String(firstToken).replace(/[^\d]/g, ''))
  const second = Number(String(secondToken).replace(/[^\d]/g, ''))
  const year = normalizeYear(yearToken)
  const preference = options.preference || 'dmy'
  const candidates = []

  const pushCandidate = (day, month, score, order) => {
    const iso = toIsoDate(day, month, year)
    if (!iso) return
    if (!candidates.some((candidate) => candidate.iso === iso)) {
      candidates.push({ iso, score, order })
    }
  }

  if (
    Number.isNaN(first) ||
    Number.isNaN(second) ||
    year === null ||
    first < 1 ||
    first > 31 ||
    second < 1 ||
    second > 31
  ) {
    return candidates
  }

  if (first > 12 && second <= 12) {
    pushCandidate(first, second, 18, 'dmy')
    return candidates
  }

  if (second > 12 && first <= 12) {
    pushCandidate(second, first, 18, 'mdy')
    return candidates
  }

  if (preference === 'mdy') {
    pushCandidate(second, first, 16, 'mdy')
    pushCandidate(first, second, 12, 'dmy')
  } else {
    pushCandidate(first, second, 16, 'dmy')
    pushCandidate(second, first, 12, 'mdy')
  }

  return candidates
}

const extractDateCandidates = (snippet, options = {}) => {
  const text = normalizeDateNoise(snippet)
  const candidates = []

  const pushCandidate = (candidate) => {
    if (!candidate?.iso) return
    candidates.push(candidate)
  }

  FULL_NUMERIC_DATE.lastIndex = 0
  for (const match of text.matchAll(FULL_NUMERIC_DATE)) {
    const numericCandidates = resolveNumericCandidates(match[1], match[2], match[3], options)
    for (const candidate of numericCandidates) {
      pushCandidate({
        ...candidate,
        index: match.index ?? 0,
        formatScore: candidate.score,
      })
    }
  }

  TEXT_DMY_DATE.lastIndex = 0
  for (const match of text.matchAll(TEXT_DMY_DATE)) {
    const month = MONTH_MAP[match[2].toLowerCase()]
    const year = normalizeYear(match[3])
    const iso = toIsoDate(match[1], month, year)
    pushCandidate({
      iso,
      index: match.index ?? 0,
      order: 'dmy',
      formatScore: 17,
    })
  }

  TEXT_MDY_DATE.lastIndex = 0
  for (const match of text.matchAll(TEXT_MDY_DATE)) {
    const month = MONTH_MAP[match[1].toLowerCase()]
    const year = normalizeYear(match[3])
    const iso = toIsoDate(match[2], month, year)
    pushCandidate({
      iso,
      index: match.index ?? 0,
      order: 'mdy',
      formatScore: 17,
    })
  }

  MONTH_YEAR_DATE.lastIndex = 0
  for (const match of text.matchAll(MONTH_YEAR_DATE)) {
    const year = normalizeYear(match[2])
    const iso = toIsoMonthEnd(match[1], year)
    pushCandidate({
      iso,
      index: match.index ?? 0,
      order: 'month-year',
      formatScore: 12,
    })
  }

  TEXT_MONTH_YEAR_DATE.lastIndex = 0
  for (const match of text.matchAll(TEXT_MONTH_YEAR_DATE)) {
    const month = MONTH_MAP[match[1].toLowerCase()]
    const yearToken = match[2] || match[3]
    const year = normalizeYear(yearToken)
    const iso = toIsoMonthEnd(month, year)
    pushCandidate({
      iso,
      index: match.index ?? 0,
      order: 'month-year',
      formatScore: match[2] ? 12 : 13,
    })
  }

  COMPACT_EIGHT_DIGITS.lastIndex = 0
  for (const match of text.matchAll(COMPACT_EIGHT_DIGITS)) {
    const value = match[1]
    const compactCandidates = resolveNumericCandidates(
      value.slice(0, 2),
      value.slice(2, 4),
      value.slice(4, 8),
      options
    )

    for (const candidate of compactCandidates) {
      pushCandidate({
        ...candidate,
        index: match.index ?? 0,
        formatScore: candidate.score - 2,
      })
    }
  }

  COMPACT_SIX_DIGITS.lastIndex = 0
  for (const match of text.matchAll(COMPACT_SIX_DIGITS)) {
    const value = match[1]
    const monthYearIso = toIsoMonthEnd(value.slice(0, 2), normalizeYear(value.slice(2, 6)))
    pushCandidate({
      iso: monthYearIso,
      index: match.index ?? 0,
      order: 'month-year',
      formatScore: 10,
    })

    const compactCandidates = resolveNumericCandidates(
      value.slice(0, 2),
      value.slice(2, 4),
      value.slice(4, 6),
      options
    )

    for (const candidate of compactCandidates) {
      pushCandidate({
        ...candidate,
        index: match.index ?? 0,
        formatScore: candidate.score - 5,
      })
    }

    const yymmddIso = toIsoDate(value.slice(4, 6), value.slice(2, 4), normalizeYear(value.slice(0, 2)))
    pushCandidate({
      iso: yymmddIso,
      index: match.index ?? 0,
      order: 'yymmdd',
      formatScore: 8,
    })
  }

  const bestByIso = new Map()
  for (const candidate of candidates) {
    if (!candidate.iso) continue
    const existing = bestByIso.get(candidate.iso)
    if (!existing || candidate.formatScore > existing.formatScore) {
      bestByIso.set(candidate.iso, candidate)
    }
  }

  return Array.from(bestByIso.values())
}

const scoreTemporalFit = (iso) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(iso)
  date.setHours(0, 0, 0, 0)

  const diffDays = Math.round((date - today) / DAY_MS)

  if (diffDays >= 0 && diffDays <= 3650) return 10
  if (diffDays >= -365 && diffDays < 0) return 6
  if (diffDays < -3650) return -12
  if (diffDays > 3650) return -5
  return 2
}

const scoreCandidatesForSnippet = (snippet, anchorMatch, options = {}) => {
  const candidates = extractDateCandidates(snippet.text, options)

  return candidates.map((candidate) => {
    let score = snippet.contextScore + candidate.formatScore + scoreTemporalFit(candidate.iso)

    if (anchorMatch) {
      score += anchorMatch.score
      if (anchorMatch.position !== -1) {
        if (candidate.index >= anchorMatch.position) {
          score += 8
        } else {
          score -= 6
        }
      }
    }

    if (
      options.preference === 'dmy' &&
      (candidate.order === 'dmy' || candidate.order === 'month-year')
    ) {
      score += 2
    }

    if (options.preference === 'mdy' && candidate.order === 'mdy') {
      score += 2
    }

    return {
      ...candidate,
      score,
    }
  })
}

/**
 * Extract an ISO-formatted expiry date from raw OCR text.
 * Pipeline:
 *   1. Normalize OCR text and build short context snippets
 *   2. Detect expiry anchors with exact, compact, and fuzzy matching
 *   3. Parse multiple date formats near those anchors
 *   4. Score candidates using proximity, date format, ambiguity rules, and temporal fit
 *   5. Fall back to best global candidate if no anchored match succeeds
 */
export const extractExpiryDate = (rawText, docKey = null) => {
  if (!rawText) return null

  const snippets = buildSnippets(rawText)
  const preference = getDatePreference(rawText, docKey)
  const docKeywords = unique(docKey ? DOC_KEYWORDS[docKey] || [] : [])
  const fallbackKeywords = unique(COMMON_KEYWORDS)
  const scoredCandidates = []

  for (const snippet of snippets) {
    const anchorMatch = docKeywords.length > 0 ? findAnchorMatch(snippet.text, docKeywords) : null
    if (!anchorMatch) continue

    scoredCandidates.push(
      ...scoreCandidatesForSnippet(snippet, anchorMatch, { preference })
    )
  }

  for (const snippet of snippets) {
    const anchorMatch = findAnchorMatch(snippet.text, fallbackKeywords)
    if (!anchorMatch) continue

    scoredCandidates.push(
      ...scoreCandidatesForSnippet(snippet, anchorMatch, { preference })
    )
  }

  if (scoredCandidates.length === 0) {
    const globalCandidates = scoreCandidatesForSnippet(
      { text: String(rawText || ''), contextScore: 0 },
      null,
      { preference }
    )
    scoredCandidates.push(...globalCandidates)
  }

  if (scoredCandidates.length === 0) return null

  scoredCandidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score
    return right.iso.localeCompare(left.iso)
  })

  return scoredCandidates[0]?.iso || null
}

/**
 * Run OCR on an image file. Returns { rawText, expiryDate } or null.
 * onProgress receives a 0-100 integer.
 * docKey hints which document heuristics to apply.
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
