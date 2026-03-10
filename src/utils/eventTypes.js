export const EVENT_TYPES = {
  INDIVIDUAL: 'Individual Event',
  TEAM: 'Team Event',
  BOTH: 'Both (Team & Individual)',
}

export const EVENT_TYPE_OPTIONS = [
  EVENT_TYPES.INDIVIDUAL,
  EVENT_TYPES.TEAM,
  EVENT_TYPES.BOTH,
]

export function normalizeEventType(type) {
  if (EVENT_TYPE_OPTIONS.includes(type)) {
    return type
  }

  const normalized = String(type || '').toLowerCase()
  if (normalized.includes('both')) return EVENT_TYPES.BOTH
  if (normalized.includes('team')) return EVENT_TYPES.TEAM
  return EVENT_TYPES.INDIVIDUAL
}

export function getParticipationOptionsByEventType(type) {
  const eventType = normalizeEventType(type)

  if (eventType === EVENT_TYPES.TEAM) {
    return ['Team']
  }

  if (eventType === EVENT_TYPES.BOTH) {
    return ['Individual', 'Team']
  }

  return ['Individual']
}

export function getDefaultParticipationByEventType(type) {
  return getParticipationOptionsByEventType(type)[0]
}
