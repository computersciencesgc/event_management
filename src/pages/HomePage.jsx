import { Link } from 'react-router-dom'
import CollegeBrand from '../components/CollegeBrand'
import { useEventContext } from '../context/EventContext'

export default function HomePage() {
  const { events, stats } = useEventContext()

  const registrationLink = `${window.location.origin}/register`

  return (
    <main className="page-shell">
      <section className="panel hero-panel">
        <div className="hero-top">
          <div>
            <CollegeBrand contextText="College Event Management" />
            <p className="muted">
              Digital registration portal for inter-college and department-level event participation.
            </p>
          </div>

          <div className="button-row">
            <Link className="btn btn-register" to="/register">
              Register Now
            </Link>
            <Link className="btn btn-dark" to="/admin/login">
              Admin Login
            </Link>
            <Link className="btn btn-dark" to="/organizer/login">
              Organizer Login
            </Link>
          </div>
        </div>

        <div className="stat-grid three-col">
          <article className="stat-card">
            <h3>Total Event Registrations</h3>
            <p>{stats.totalEventRegistrations}</p>
          </article>
          <article className="stat-card">
            <h3>Total Participants</h3>
            <p>{stats.totalParticipants}</p>
          </article>
          <article className="stat-card">
            <h3>Pending Approvals</h3>
            <p>{stats.pendingApprovals}</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2>Available Events</h2>
        {events.length === 0 ? (
          <p className="muted">No events added yet. Please check later or contact organizers.</p>
        ) : (
          <div className="event-list">
            {events.map((event) => (
              <article className="event-card" key={event.id}>
                <h3>{event.name}</h3>
                <p>{event.type}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Mobile Registration Link</h2>
        <p className="muted">Open this link from mobile to register directly:</p>
        <a className="link-box" href={registrationLink} target="_blank" rel="noreferrer">
          {registrationLink}
        </a>
      </section>
    </main>
  )
}
