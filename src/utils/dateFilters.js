/**
 * Monthly filter dropdown options matching the Student Attendance detail format.
 */
export const MONTH_FILTER_OPTIONS = [
  { id: 'ALL', label: 'គ្រប់ខែ', shortLabel: 'គ្រប់ខែ' },
  { id: '01', label: 'មករា (Jan)', shortLabel: 'មករា' },
  { id: '02', label: 'កុម្ភៈ (Feb)', shortLabel: 'កុម្ភៈ' },
  { id: '03', label: 'មីនា (Mar)', shortLabel: 'មីនា' },
  { id: '04', label: 'មេសា (Apr)', shortLabel: 'មេសា' },
  { id: '05', label: 'ឧសភា (May)', shortLabel: 'ឧសភា' },
  { id: '06', label: 'មិថុនា (Jun)', shortLabel: 'មិថុនា' },
  { id: '07', label: 'កក្កដា (Jul)', shortLabel: 'កក្កដា' },
  { id: '08', label: 'សីហា (Aug)', shortLabel: 'សីហា' },
  { id: '09', label: 'កញ្ញា (Sep)', shortLabel: 'កញ្ញា' },
  { id: '10', label: 'តុលា (Oct)', shortLabel: 'តុលា' },
  { id: '11', label: 'វិច្ឆិកា (Nov)', shortLabel: 'វិច្ឆិកា' },
  { id: '12', label: 'ធ្នូ (Dec)', shortLabel: 'ធ្នូ' },
]

const KH_MONTH_NAMES = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
]

/**
 * Checks whether a date string/object belongs to the selected 2-digit month ID.
 */
export function matchesMonthFilter(dateStr, monthId) {
  if (!monthId || monthId === 'ALL') return true
  if (!dateStr) return false
  const str = String(dateStr).trim()
  // YYYY-MM-DD format
  const dashMatch = str.match(/^\d{4}-(\d{2})/)
  if (dashMatch) return dashMatch[1] === monthId
  // YYYY/MM/DD format
  const slashMatch = str.match(/^\d{4}\/(\d{2})/)
  if (slashMatch) return slashMatch[1] === monthId
  // DD-MM-YYYY or DD/MM/YYYY format
  const reverseMatch = str.match(/^\d{1,2}[-\/](\d{1,2})[-\/]\d{4}/)
  if (reverseMatch) return String(reverseMatch[1]).padStart(2, '0') === monthId
  // Fallback to Date parsing
  try {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      const m = String(d.getMonth() + 1).padStart(2, '0')
      return m === monthId
    }
  } catch (e) {}
  return String(dateStr).split('-')[1] === monthId
}

/**
 * Formats the report title month suffix ('ខែមករា' .. 'ខែធ្នូ', or 'គ្រប់ខែ' when unfiltered).
 */
export function getExportMonthSuffix(monthId) {
  if (!monthId || monthId === 'ALL') return 'គ្រប់ខែ'
  const idx = Number(monthId) - 1
  if (Number.isInteger(idx) && idx >= 0 && idx < KH_MONTH_NAMES.length) {
    return `ខែ${KH_MONTH_NAMES[idx]}`
  }
  return 'គ្រប់ខែ'
}

/**
 * Formats the class segment for summary report subtitles ('ថ្នាក់៖ គ្រប់ថ្នាក់' or 'ថ្នាក់ទី ...').
 */
export function getExportClassLabel(filterClass) {
  const cls = String(filterClass ?? '').trim()
  if (!cls || cls === 'ALL') return 'ថ្នាក់៖ គ្រប់ថ្នាក់'
  return cls.startsWith('ថ្នាក់') ? cls : `ថ្នាក់ទី ${cls}`
}

/**
 * Builds ordered subtitle segments: academic year, student count, then class label.
 */
export function buildSummarySubtitleParts({ academicYear, studentCountText, filterClass }) {
  return [
    `ឆ្នាំសិក្សា ${academicYear}`,
    `សរុបចំនួនសិស្ស៖ ${studentCountText} នាក់`,
    getExportClassLabel(filterClass),
  ]
}

