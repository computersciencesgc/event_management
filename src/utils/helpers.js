export function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function statusClass(status) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'approved') return 'pill approved'
  if (normalized === 'rejected') return 'pill rejected'
  return 'pill pending'
}

export function getParticipationLabel(registration) {
  if (!registration) return '-'
  if (registration.participation === 'Team') {
    const label = registration.teamName || 'Team'
    return registration.teamId ? `${label} (ID: ${registration.teamId})` : label
  }
  return 'Individual'
}
