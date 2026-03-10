import { Link, useParams } from 'react-router-dom'
import CollegeBrand from '../components/CollegeBrand'
import { useEventContext } from '../context/EventContext'
import { formatDateTime, getParticipationLabel, statusClass } from '../utils/helpers'
import { createRegistrationPdf } from '../utils/registrationPdf'

export default function SuccessPage() {
  const { candidateId } = useParams()
  const { findParticipantById } = useEventContext()

  const participant = findParticipantById(candidateId)
  const hasTeamRegistrations = participant
    ? participant.registrations.some((registration) => registration.participation === 'Team')
    : false

  const onDownloadDetails = () => {
    if (!participant) return

    const doc = createRegistrationPdf(participant)
    const fileName = `registration-${String(participant.candidateId || 'details').replace(/[^\w-]/g, '_')}.pdf`
    doc.save(fileName)
  }

  if (!participant) {
    return (
      <main className="page-shell">
        <section className="panel">
          <h1>Registration Details</h1>
          <p className="alert error">Candidate record not found. Please register again.</p>
          <div className="button-row">
            <Link className="btn btn-primary" to="/register">
              Register Participant
            </Link>
            <Link className="btn btn-dark" to="/">
              Go to Home
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="panel success-panel">
        <CollegeBrand contextText="College Event Management" />
        <h1>Registration Successful</h1>
        <p>
          Thank you, <strong>{participant.name}</strong>.
        </p>
        <p className="muted">Your registration has been submitted successfully.</p>

        <p className="alert success">
          <strong>Candidate ID:</strong> {participant.candidateId}
        </p>

        <h2>Submitted Details</h2>
        <div className="details-grid">
          <article className="detail-card">
            <p className="detail-label">Name</p>
            <p className="detail-value">{participant.name}</p>
          </article>
          <article className="detail-card">
            <p className="detail-label">College</p>
            <p className="detail-value">{participant.college}</p>
          </article>
          <article className="detail-card">
            <p className="detail-label">Phone</p>
            <p className="detail-value">{participant.phone}</p>
          </article>
          <article className="detail-card">
            <p className="detail-label">Email</p>
            <p className="detail-value">{participant.email}</p>
          </article>
          <article className="detail-card">
            <p className="detail-label">Candidate ID</p>
            <p className="detail-value">{participant.candidateId}</p>
          </article>
          <article className="detail-card">
            <p className="detail-label">Status</p>
            <p className="detail-value">
              <span className={statusClass(participant.status)}>{participant.status}</span>
            </p>
          </article>
          <article className="detail-card">
            <p className="detail-label">Registered At</p>
            <p className="detail-value">{formatDateTime(participant.registeredAt)}</p>
          </article>
        </div>

        <h2>Registered Events</h2>
        <div className="table-wrap">
          <table className="success-events-table">
            <thead>
            <tr>
              <th>Event</th>
              <th>Type</th>
              <th>Team / Individual</th>
              <th>Team ID</th>
            </tr>
          </thead>
          <tbody>
            {participant.registrations.map((registration) => (
              <tr key={`${participant.candidateId}-${registration.eventId}`}>
                <td data-label="Event">{registration.eventName}</td>
                <td data-label="Type">{registration.eventType}</td>
                <td data-label="Team / Individual">{getParticipationLabel(registration)}</td>
                <td data-label="Team ID">{registration.teamId || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasTeamRegistrations ? (
        <p className="field-note">
          Share the Team ID above with up to three teammates so they can register with the same team name
          and team ID for each team event.
        </p>
      ) : null}

        <div className="button-row success-actions">
          <button className="btn btn-register" onClick={onDownloadDetails} type="button">
            Download PDF
          </button>
          <Link className="btn btn-primary" to="/register">
            Register Another Participant
          </Link>
          <Link className="btn btn-dark" to="/">
            Go to Home
          </Link>
        </div>
      </section>
    </main>
  )
}
