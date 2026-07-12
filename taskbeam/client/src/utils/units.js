export const UNIT_SYSTEMS = {
  imperial: {
    length: 'ft',
    area: 'sq ft',
    label: 'Imperial (ft)',
  },
  metric: {
    length: 'm',
    area: 'sq m',
    label: 'Metric (m)',
  },
}

const FT_TO_M = 0.3048
const SQFT_TO_SQM = 0.0929

export function convertLength(value, unitSystem) {
  const v = parseFloat(value) || 0
  if (unitSystem === 'metric') return parseFloat((v * FT_TO_M).toFixed(2))
  return parseFloat(v.toFixed(2))
}

export function convertArea(value, unitSystem) {
  const v = parseFloat(value) || 0
  if (unitSystem === 'metric') return parseFloat((v * SQFT_TO_SQM).toFixed(2))
  return parseFloat(v.toFixed(2))
}

export function lengthUnit(unitSystem) {
  return UNIT_SYSTEMS[unitSystem]?.length || 'ft'
}

export function areaUnit(unitSystem) {
  return UNIT_SYSTEMS[unitSystem]?.area || 'sq ft'
}

export function formatLength(value, unitSystem) {
  return `${convertLength(value, unitSystem)} ${lengthUnit(unitSystem)}`
}

export function formatArea(value, unitSystem) {
  return `${convertArea(value, unitSystem)} ${areaUnit(unitSystem)}`
}