/**
 * Generate a URL slug for a property
 * Format: /CA/San-Diego/4521-Ocean-View-Dr-92130
 * With unit: /CA/San-Marcos/858-S-Rancho-Santa-Fe-Rd-92078/unit-F
 */
export function generatePropertySlug(address, city, state, zip, unit) {
  const fmt = (s) => s?.toString()
    .trim()
    .replace(/[#,\.]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

  const statePart   = state?.toUpperCase() || 'CA'
  const cityPart    = fmt(city) || 'Unknown'
  const addrPart    = fmt(`${address} ${zip}`)
  const unitPart    = unit ? `/unit-${fmt(unit)}` : ''

  return `/${statePart}/${cityPart}/${addrPart}${unitPart}`
}

/**
 * Parse a slug back into address components
 */
export function parsePropertySlug(state, city, addressZip, unit) {
  // addressZip is like "4521-Ocean-View-Dr-92130"
  // Extract zip (last segment that's all digits)
  const parts  = addressZip.split('-')
  const zip    = parts[parts.length - 1]?.match(/^\d{5}$/) ? parts[parts.length - 1] : null
  const addrParts = zip ? parts.slice(0, -1) : parts
  const address = addrParts.join(' ')
  const cityStr = city?.replace(/-/g, ' ')
  const unitStr = unit?.replace(/^unit-/i, '')

  return { state, city: cityStr, address, zip, unit: unitStr || null }
}
