import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CollegeBrand from '../components/CollegeBrand'
import { useAuthContext } from '../context/AuthContext'
import { useEventContext } from '../context/EventContext'
import { formatDateTime, getParticipationLabel, statusClass } from '../utils/helpers'
import { createRegistrationPdf } from '../utils/registrationPdf'

const defaultFilters = {
  eventId: '',
  college: '',
  status: '',
  search: '',
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

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuthContext()
  const {
    events,
    participants,
    stats,
    collegeOptions,
    updateParticipantStatus,
  } = useEventContext()

  const [filters, setFilters] = useState(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
  const [message, setMessage] = useState(null)

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

  const onStatusChange = async (candidateId, status) => {
    const result = updateParticipantStatus(candidateId, status)
    if (!result.ok) {
      setMessage({ type: 'error', text: result.message })
      return
    }

    if (status !== 'approved') {
      setMessage({ type: 'success', text: `Candidate ${candidateId} rejected successfully.` })
      return
    }

    const participant = participants.find((item) => item.candidateId === candidateId)
    if (!participant) {
      setMessage({ type: 'success', text: `Candidate ${candidateId} approved successfully.` })
      return
    }

    try {
      const approvedParticipant = {
        ...participant,
        status: 'approved',
      }
      const doc = createRegistrationPdf(approvedParticipant)
      const pdfDataUri = doc.output('datauristring')
      const generatedPdfBase64 = pdfDataUri.split(',')[1]
      const candidatePdfName = `registration-${approvedParticipant.candidateId}.pdf`
      const eventNames =
        approvedParticipant.registrations.map((registration) => registration.eventName).join(', ') || 'N/A'
      const response = await fetch('/api/send-confirmation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: approvedParticipant.email,
          candidateId: approvedParticipant.candidateId,
          eventName: eventNames,
          eventDate: 'To be announced',
          eventLocation: 'To be announced',
          pdfBase64: generatedPdfBase64,
          pdfFileName: candidatePdfName,
        }),
      })

      const raw = await response.text()
      let payload = null
      if (raw) {
        try {
          payload = JSON.parse(raw)
        } catch {
          throw new Error(
            response.ok
              ? 'Email service returned invalid response.'
              : 'Mail server is not running. Start `npm run dev` and try again.',
          )
        }
      }

      if (!payload) {
        throw new Error(
          response.ok
            ? 'Email service returned empty response.'
            : 'Mail server is not running. Start `npm run dev` and try again.',
        )
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || 'Failed to send confirmation email.')
      }

      setMessage({
        type: 'success',
        text: `Candidate ${candidateId} approved and confirmation email sent.`,
      })
    } catch (error) {
      const mailMessage = String(error?.message || '').toLowerCase().includes('failed to fetch')
        ? 'Mail server is not running. Start `npm run dev` and try again.'
        : error?.message || 'Unable to send confirmation email.'

      setMessage({
        type: 'error',
        text: `Candidate ${candidateId} approved, but email failed: ${mailMessage}`,
      })
    }
  }

  const onLogout = () => {
    logout('organizer')
    navigate('/organizer/login')
  }

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="hero-top">
          <div>
            <CollegeBrand contextText="College Event Management" />
            <h1 className="page-title">Organizer Dashboard</h1>
            <p className="muted">Approve candidate registrations for event participation.</p>
          </div>
          <div className="button-row">
            <Link className="btn btn-dark" to="/">
              Home
            </Link>
            <Link className="btn btn-primary" to="/admin">
              Admin Panel
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
            <h3>Pending Approvals</h3>
            <p>{stats.pendingApprovals}</p>
          </article>
          <article className="stat-card">
            <h3>Approved</h3>
            <p>{stats.approvedParticipants}</p>
          </article>
          <article className="stat-card">
            <h3>Rejected</h3>
            <p>{stats.rejectedParticipants}</p>
          </article>
        </div>

        <section className="panel box-panel">
          <h2>Filter Participants</h2>
          <div className="two-grid">
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
          </div>

          <div className="two-grid">
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
                placeholder="Candidate ID, name, college, phone, email, team"
                type="search"
                value={filters.search}
              />
            </label>
          </div>

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
        </section>
      </section>

      <section className="panel">
        <h2>Candidate Approval Queue ({filteredParticipants.length})</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Candidate ID</th>
                <th>Name</th>
                <th>College</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Events</th>
                <th>Team / Individual</th>
                <th>Status</th>
                <th>Registered At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={10}>No participants found for the selected filters.</td>
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
                    <td>
                      <div className="action-inline">
                        <button
                          className="btn btn-register small"
                          disabled={participant.status === 'approved'}
                          onClick={() => onStatusChange(participant.candidateId, 'approved')}
                          type="button"
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger small"
                          disabled={
                            participant.status === 'approved' || participant.status === 'rejected'
                          }
                          onClick={() => onStatusChange(participant.candidateId, 'rejected')}
                          type="button"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
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
