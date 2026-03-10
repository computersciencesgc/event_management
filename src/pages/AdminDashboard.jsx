import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CollegeBrand from '../components/CollegeBrand'
import { useAuthContext } from '../context/AuthContext'
import { useEventContext } from '../context/EventContext'
import { EVENT_TYPE_OPTIONS } from '../utils/eventTypes'
import { formatDateTime, getParticipationLabel, statusClass } from '../utils/helpers'

const defaultFilters = {
  eventId: '',
  college: '',
  status: '',
  search: '',
}

const exportHeaders = [
  'Candidate ID',
  'Name',
  'College',
  'Phone',
  'Email',
  'Registered Events',
  'Team / Individual',
  'Status',
  'Registered At',
]

function csvEscape(value) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function triggerDownload({ content, fileName, mimeType }) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function participantToExportRow(participant) {
  return [
    participant.candidateId,
    participant.name,
    participant.college,
    participant.phone,
    participant.email,
    participant.registrations.map((registration) => registration.eventName).join(', '),
    participant.registrations.map((registration) => getParticipationLabel(registration)).join(', '),
    participant.status,
    formatDateTime(participant.registeredAt),
  ]
}

function includesSearch(participant, searchValue) {
  const term = searchValue.trim().toLowerCase()
  if (!term) return true

  const values = [
    participant.candidateId,
    participant.name,
    participant.college,
    participant.phone,
    participant.email,
    participant.status,
    participant.registrations.map((registration) => registration.eventName).join(' '),
    participant.registrations.map((registration) => registration.teamName).join(' '),
    participant.registrations.map((registration) => registration.teamId).join(' '),
  ]

  return values.some((value) => String(value).toLowerCase().includes(term))
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuthContext()
  const {
    events,
    participants,
    stats,
    collegeOptions,
    addEvent,
    deleteEvent,
    resetParticipants,
  } = useEventContext()


  const [eventForm, setEventForm] = useState({ name: '', type: EVENT_TYPE_OPTIONS[0] })
  const [filters, setFilters] = useState(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
  const [message, setMessage] = useState(null)

  const participantsByEvent = useMemo(() => {
    const result = {}
    for (const event of events) {
      result[event.id] = participants.filter((participant) =>
        participant.registrations.some((registration) => registration.eventId === event.id),
      ).length
    }
    return result
  }, [events, participants])

  const filteredParticipants = useMemo(() => {
    return participants.filter((participant) => {
      if (appliedFilters.eventId) {
        const isRegistered = participant.registrations.some(
          (registration) => registration.eventId === appliedFilters.eventId,
        )
        if (!isRegistered) return false
      }

      if (appliedFilters.college && participant.college !== appliedFilters.college) {
        return false
      }

      if (appliedFilters.status && participant.status !== appliedFilters.status) {
        return false
      }

      return includesSearch(participant, appliedFilters.search)
    })
  }, [appliedFilters, participants])

  const onAddEvent = (event) => {
    event.preventDefault()
    const result = addEvent(eventForm)
    if (!result.ok) {
      setMessage({ type: 'error', text: result.message })
      return
    }

    setEventForm({ name: '', type: EVENT_TYPE_OPTIONS[0] })
    setMessage({ type: 'success', text: `Event "${result.event.name}" added successfully.` })
  }

  const onDeleteEvent = (eventId) => {
    if (!window.confirm('Delete this event?')) return

    const result = deleteEvent(eventId)
    if (!result.ok) {
      setMessage({ type: 'error', text: result.message })
      return
    }

    setMessage({ type: 'success', text: 'Event deleted successfully.' })
  }

  const onLogout = () => {
    logout('admin')
    navigate('/admin/login')
  }

  const onReset = () => {
    if (!window.confirm('Reset all participant registrations?')) return
    resetParticipants()
    setMessage({ type: 'success', text: 'All registrations have been reset.' })
  }

  const onDownloadCsv = () => {
    if (filteredParticipants.length === 0) {
      setMessage({ type: 'error', text: 'No filtered participants available to export.' })
      return
    }

    const rows = filteredParticipants.map(participantToExportRow)
    const csvContent = `\uFEFF${[
      exportHeaders.map(csvEscape).join(','),
      ...rows.map((row) => row.map(csvEscape).join(',')),
    ].join('\n')}`

    const dateSuffix = new Date().toISOString().slice(0, 10)
    triggerDownload({
      content: csvContent,
      fileName: `candidate-details-${dateSuffix}.csv`,
      mimeType: 'text/csv;charset=utf-8;',
    })
  }

  const onDownloadExcel = () => {
    if (filteredParticipants.length === 0) {
      setMessage({ type: 'error', text: 'No filtered participants available to export.' })
      return
    }

    const rows = filteredParticipants.map(participantToExportRow)
    const headerRow = exportHeaders.map((header) => `<th>${htmlEscape(header)}</th>`).join('')
    const bodyRows = rows
      .map((row) => `<tr>${row.map((cell) => `<td>${htmlEscape(cell)}</td>`).join('')}</tr>`)
      .join('')

    const excelTable = `
      <html>
        <head><meta charset="UTF-8" /></head>
        <body>
          <table border="1">
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </body>
      </html>
    `

    const dateSuffix = new Date().toISOString().slice(0, 10)
    triggerDownload({
      content: excelTable,
      fileName: `candidate-details-${dateSuffix}.xls`,
      mimeType: 'application/vnd.ms-excel;charset=utf-8;',
    })
  }

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="hero-top">
          <div>
            <CollegeBrand contextText="College Event Management" />
            <h1 className="page-title">Admin Dashboard</h1>
          </div>
          <div className="button-row">
            <Link className="btn btn-dark" to="/">
              Home
            </Link>
            <Link className="btn btn-primary" to="/organizer">
              Organizer Panel
            </Link>
            <button className="btn btn-danger" onClick={onLogout} type="button">
              Logout
            </button>
          </div>
        </div>

        {message ? (
          <p className={`alert ${message.type === 'success' ? 'success' : 'error'}`}>{message.text}</p>
        ) : null}

        <div className="stat-grid three-col">
          <article className="stat-card">
            <h3>Total Events</h3>
            <p>{stats.totalEvents}</p>
          </article>
          <article className="stat-card">
            <h3>Total Event Registrations</h3>
            <p>{stats.totalEventRegistrations}</p>
          </article>
          <article className="stat-card">
            <h3>Total Participants</h3>
            <p>{stats.totalParticipants}</p>
          </article>
        </div>

        <div className="split-grid">
          <div className="column-stack">
            <form className="panel box-panel" onSubmit={onAddEvent}>
            <h2>Add Event</h2>
            <label>
              Event Name
              <input
                onChange={(event) => setEventForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Enter event name"
                required
                type="text"
                value={eventForm.name}
              />
            </label>
            <label>
              Type
              <select
                onChange={(event) => setEventForm((prev) => ({ ...prev, type: event.target.value }))}
                value={eventForm.type}
              >
                {EVENT_TYPE_OPTIONS.map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {eventType}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn btn-primary full-width" type="submit">
              Add Event
            </button>
            </form>

          </div>

          <form className="panel box-panel" onSubmit={(event) => event.preventDefault()}>
            <h2>Filter Candidate Details</h2>
            <label>
              Event
              <select
                onChange={(event) => setFilters((prev) => ({ ...prev, eventId: event.target.value }))}
                value={filters.eventId}
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              College
              <select
                onChange={(event) => setFilters((prev) => ({ ...prev, college: event.target.value }))}
                value={filters.college}
              >
                <option value="">All Colleges</option>
                {collegeOptions.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                value={filters.status}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>

            <label>
              Search
              <input
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Candidate ID, name, college, phone, email, team, team ID"
                type="search"
                value={filters.search}
              />
            </label>

            <div className="button-row">
              <button className="btn btn-primary" onClick={() => setAppliedFilters(filters)} type="button">
                Apply
              </button>
              <button
                className="btn btn-dark"
                onClick={() => {
                  setFilters(defaultFilters)
                  setAppliedFilters(defaultFilters)
                }}
                type="button"
              >
                Clear
              </button>
            </div>
          </form>

        </div>
      </section>

      <section className="panel">
        <h2>Event Management</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Type</th>
                <th>Participants</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4}>No events available.</td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.name}</td>
                    <td>{event.type}</td>
                    <td>{participantsByEvent[event.id] || 0}</td>
                    <td>
                      <button
                        className="btn btn-danger small"
                        disabled={(participantsByEvent[event.id] || 0) > 0}
                        onClick={() => onDeleteEvent(event.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="muted">Events with participants cannot be deleted until their registrations are removed.</p>
      </section>

      <section className="panel">
        <div className="header-actions">
          <h2>Participants ({filteredParticipants.length})</h2>
          <div className="button-row">
            <button className="btn btn-primary" onClick={onDownloadCsv} type="button">
              Download CSV
            </button>
            <button className="btn btn-register" onClick={onDownloadExcel} type="button">
              Download Excel
            </button>
            <button className="btn btn-dark" onClick={onReset} type="button">
              Reset All Registrations
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Candidate ID</th>
                <th>Name</th>
                <th>College</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Registered Events</th>
                <th>Team / Individual</th>
                <th>Status</th>
                <th>Registered At</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={9}>No participants found for the selected filters.</td>
                </tr>
              ) : (
                filteredParticipants.map((participant) => (
                  <tr key={participant.candidateId}>
                    <td>{participant.candidateId}</td>
                    <td>{participant.name}</td>
                    <td>{participant.college}</td>
                    <td>{participant.phone}</td>
                    <td>{participant.email}</td>
                    <td>
                      {participant.registrations.map((registration) => registration.eventName).join(', ')}
                    </td>
                    <td>
                      {participant.registrations.map((registration) => getParticipationLabel(registration)).join(', ')}
                    </td>
                    <td>
                      <span className={statusClass(participant.status)}>{participant.status}</span>
                    </td>
                    <td>{formatDateTime(participant.registeredAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
