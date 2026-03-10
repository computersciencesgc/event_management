import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CollegeBrand from '../components/CollegeBrand'
import { getNextTeamId, useEventContext } from '../context/EventContext'
import {
  getDefaultParticipationByEventType,
  getParticipationOptionsByEventType,
} from '../utils/eventTypes'

const emptyRegistration = {
  eventId: '',
  participation: 'Individual',
  teamName: '',
  teamId: '',
  teamMode: 'new',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { events, registerParticipant, teams } = useEventContext()
  const exampleTeamId = useMemo(() => getNextTeamId(teams), [teams])
  const [form, setForm] = useState({
    name: '',
    college: '',
    phone: '',
    email: '',
    registrations: [{ ...emptyRegistration }, { ...emptyRegistration }],
  })

  const [message, setMessage] = useState(null)

  const eventMap = useMemo(() => {
    return Object.fromEntries(events.map((event) => [event.id, event]))
  }, [events])

  const firstEvent = eventMap[form.registrations[0].eventId]
  const secondEvent = eventMap[form.registrations[1].eventId]

  const firstParticipationOptions = firstEvent
    ? getParticipationOptionsByEventType(firstEvent.type)
    : ['Individual']
  const secondParticipationOptions = secondEvent
    ? getParticipationOptionsByEventType(secondEvent.type)
    : ['Individual']

  const firstParticipationNote =
    firstEvent && firstParticipationOptions.length === 1
      ? firstParticipationOptions[0] === 'Team'
        ? 'This event allows Team participation only.'
        : 'This event allows Individual participation only.'
      : null

  const secondParticipationNote =
    secondEvent && secondParticipationOptions.length === 1
      ? secondParticipationOptions[0] === 'Team'
        ? 'This event allows Team participation only.'
        : 'This event allows Individual participation only.'
      : null

  const availableSecondEvents = events.filter((event) => event.id !== form.registrations[0].eventId)

  const handleTeamModeChange = (index, mode) => {
    updateRegistration(index, {
      teamMode: mode,
      teamId: '',
      ...(mode === 'join' ? { teamName: '' } : {}),
    })
  }

  const renderTeamSection = (index) => {
    const registration = form.registrations[index]
    if (registration.participation !== 'Team') return null

    const event = eventMap[registration.eventId]
    const eventName = event?.name || 'this event'
    const modeOptions = [
      {
        value: 'new',
        label: 'Create new team',
        description: 'Choose a unique name and share the auto-generated Team ID with teammates.',
      },
      {
        value: 'join',
        label: 'Join existing team',
        description: 'Enter the Team ID provided by your captain (max 4 members per team).',
      },
    ]

    return (
      <div className="team-section">
        <div className="team-mode-picker" role="radiogroup" aria-label="Team participation mode">
          {modeOptions.map((option) => (
            <label
              key={`${index}-${option.value}`}
              className={`team-mode-card ${registration.teamMode === option.value ? 'active' : ''}`}
            >
              <input
                checked={registration.teamMode === option.value}
                name={`team-mode-${index}`}
                onChange={() => handleTeamModeChange(index, option.value)}
                type="radio"
                value={option.value}
              />
              <span className="team-mode-title">{option.label}</span>
              <span className="team-mode-description">{option.description}</span>
            </label>
          ))}
        </div>

        {registration.teamMode === 'new' ? (
          <>
            <label>
              Team Name (if team event)
              <input
                onChange={(event) => updateRegistration(index, { teamName: event.target.value })}
                placeholder="Example: Alpha Coders"
                required
                type="text"
                value={registration.teamName}
              />
            </label>
            <label className="team-id-preview">
              <span>Team ID (auto-generated)</span>
              <input disabled value={exampleTeamId} type="text" />
            </label>
            <p className="field-note grid-note">
              A new Team ID is assigned once the first teammate submits for {eventName}. Share that ID so others can join.
            </p>
          </>
        ) : (
          <>
            <label>
              Team ID (for existing teams)
              <input
                onChange={(event) => updateRegistration(index, { teamId: event.target.value.toUpperCase() })}
                placeholder="Example: TEAM-001"
                type="text"
                value={registration.teamId}
              />
            </label>
            <p className="field-note grid-note">
              Team IDs are event-specific. Paste the code for {eventName} so we can add you to the right team.
            </p>
          </>
        )}
      </div>
    )
  }

  const onFieldChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const updateRegistration = (index, patch) => {
    setForm((prev) => {
      const next = [...prev.registrations]
      next[index] = {
        ...next[index],
        ...patch,
      }
      return {
        ...prev,
        registrations: next,
      }
    })
  }

  const onSelectEvent = (index, eventId) => {
    const selectedEvent = eventMap[eventId]
    if (!selectedEvent) {
      updateRegistration(index, {
        eventId: '',
        participation: 'Individual',
        teamName: '',
        teamId: '',
      })
      return
    }

    updateRegistration(index, {
      eventId,
      participation: getDefaultParticipationByEventType(selectedEvent.type),
      teamName: '',
      teamId: '',
      teamMode: 'new',
    })

    if (index === 0 && eventId === form.registrations[1].eventId) {
      updateRegistration(1, {
        eventId: '',
        participation: 'Individual',
        teamName: '',
        teamId: '',
        teamMode: 'new',
      })
    }
  }

  const onSubmit = (event) => {
    event.preventDefault()

    const phoneOnlyDigits = form.phone.replace(/\D/g, '')
    if (phoneOnlyDigits.length < 10) {
      setMessage({ type: 'error', text: 'Phone number must contain at least 10 digits.' })
      return
    }

    const result = registerParticipant({
      ...form,
      phone: phoneOnlyDigits,
    })

    if (!result.ok) {
      setMessage({ type: 'error', text: result.message })
      return
    }

    navigate(`/success/${result.participant.candidateId}`)
  }

  if (events.length === 0) {
    return (
      <main className="page-shell">
        <section className="panel">
          <h1>Participant Registration</h1>
          <p className="alert error">
            No events are available currently. Please contact admin or organizer to add events.
          </p>
          <Link className="btn btn-dark" to="/">
            Back to Home
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="hero-top">
          <div>
            <CollegeBrand contextText="College Event Management" />
            <h1 className="page-title">Participant Registration</h1>
            <p className="muted">Fill in the form to register for up to 2 events.</p>
          </div>
          <Link className="btn btn-dark" to="/">
            Back to Home
          </Link>
        </div>

        {message ? <p className={`alert ${message.type === 'success' ? 'success' : 'error'}`}>{message.text}</p> : null}

        <form className="stack-form" onSubmit={onSubmit}>
          <h2>Candidate Details</h2>

          <div className="four-grid">
            <label>
              Student Name
              <input
                name="name"
                onChange={onFieldChange}
                placeholder="Enter student name"
                required
                type="text"
                value={form.name}
              />
            </label>

            <label>
              College Name
              <input
                name="college"
                onChange={onFieldChange}
                placeholder="Enter college name"
                required
                type="text"
                value={form.college}
              />
            </label>

            <label>
              Phone Number
              <input
                name="phone"
                onChange={onFieldChange}
                placeholder="Enter phone number"
                required
                type="tel"
                value={form.phone}
              />
            </label>

            <label>
              Email
              <input
                name="email"
                onChange={onFieldChange}
                placeholder="Enter email address"
                required
                type="email"
                value={form.email}
              />
            </label>
          </div>

          <h2>Event 1 (Required)</h2>
          <div className="two-grid">
            <label>
              Event Name
              <select
                onChange={(event) => onSelectEvent(0, event.target.value)}
                required
                value={form.registrations[0].eventId}
              >
                <option value="">Select an event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Team / Individual
                  <select
                    disabled={!form.registrations[0].eventId || firstParticipationOptions.length === 1}
                    onChange={(event) => {
                      const isTeam = event.target.value === 'Team'
                      updateRegistration(0, {
                        participation: event.target.value,
                        teamName: isTeam ? form.registrations[0].teamName : '',
                        teamId: isTeam ? form.registrations[0].teamId : '',
                        teamMode: isTeam ? form.registrations[0].teamMode : 'new',
                      })
                    }}
                    value={form.registrations[0].participation}
                  >
                {firstParticipationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {firstParticipationNote ? <p className="field-note grid-note">{firstParticipationNote}</p> : null}

          {renderTeamSection(0)}

          <h2>Event 2 (Optional)</h2>
          <p className="muted">Choose a second event only if needed.</p>
          <div className="two-grid">
            <label>
              Event Name
              <select
                onChange={(event) => onSelectEvent(1, event.target.value)}
                value={form.registrations[1].eventId}
              >
                <option value="">No second event</option>
                {availableSecondEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Team / Individual
                  <select
                    disabled={!form.registrations[1].eventId || secondParticipationOptions.length === 1}
                    onChange={(event) => {
                      const isTeam = event.target.value === 'Team'
                      updateRegistration(1, {
                        participation: event.target.value,
                        teamName: isTeam ? form.registrations[1].teamName : '',
                        teamId: isTeam ? form.registrations[1].teamId : '',
                        teamMode: isTeam ? form.registrations[1].teamMode : 'new',
                      })
                    }}
                    value={form.registrations[1].participation}
                  >
                {secondParticipationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {secondParticipationNote ? <p className="field-note grid-note">{secondParticipationNote}</p> : null}

          {renderTeamSection(1)}

          <button className="btn btn-primary full-width" type="submit">
            Submit Registration
          </button>
        </form>
      </section>
    </main>
  )
}
