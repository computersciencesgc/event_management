/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  EVENT_TYPES,
  getDefaultParticipationByEventType,
  getParticipationOptionsByEventType,
  normalizeEventType,
} from '../utils/eventTypes'

const EventContext = createContext(null)

const STORAGE_KEYS = {
  events: 'sgc_events',
  participants: 'sgc_participants',
  teams: 'sgc_teams',
}

const DEFAULT_EVENTS = [
  {
    id: 'EVT-001',
    name: 'Coding Contest',
    type: EVENT_TYPES.INDIVIDUAL,
    createdAt: new Date('2026-01-20T10:00:00').toISOString(),
  },
  {
    id: 'EVT-002',
    name: 'Debugging Relay',
    type: EVENT_TYPES.TEAM,
    createdAt: new Date('2026-01-20T10:15:00').toISOString(),
  },
  {
    id: 'EVT-003',
    name: 'Tech Treasure Hunt',
    type: EVENT_TYPES.BOTH,
    createdAt: new Date('2026-01-20T10:30:00').toISOString(),
  },
]

const PARTICIPANT_STATUS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

function getInitialTeams() {
  const stored = safelyParse(localStorage.getItem(STORAGE_KEYS.teams), [])
  return Array.isArray(stored) ? stored : []
}

export function getNextTeamId(teams) {
  const max = teams.reduce((highest, team) => {
    const num = Number.parseInt(String(team.id).replace(/\D/g, ''), 10)
    return Number.isNaN(num) ? highest : Math.max(highest, num)
  }, 0)

  return `TEAM-${String(max + 1).padStart(3, '0')}`
}

function safelyParse(value, fallback) {
  try {
    if (!value) return fallback
    const parsed = JSON.parse(value)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function getInitialEvents() {
  const raw = localStorage.getItem(STORAGE_KEYS.events)
  if (raw === null) {
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(DEFAULT_EVENTS))
    return DEFAULT_EVENTS
  }

  const stored = safelyParse(raw, null)
  if (Array.isArray(stored)) {
    return stored.map((event) => ({
      ...event,
      type: normalizeEventType(event.type),
    }))
  }

  localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(DEFAULT_EVENTS))
  return DEFAULT_EVENTS
}

function getInitialParticipants() {
  const stored = safelyParse(localStorage.getItem(STORAGE_KEYS.participants), [])
  return Array.isArray(stored) ? stored : []
}

function createEventId(events) {
  const max = events.reduce((highest, event) => {
    const num = Number.parseInt(String(event.id).replace(/\D/g, ''), 10)
    return Number.isNaN(num) ? highest : Math.max(highest, num)
  }, 0)

  return `EVT-${String(max + 1).padStart(3, '0')}`
}

function createCandidateId(participants) {
  const max = participants.reduce((highest, participant) => {
    const num = Number.parseInt(String(participant.candidateId).replace(/\D/g, ''), 10)
    return Number.isNaN(num) ? highest : Math.max(highest, num)
  }, 0)

  return `CD-${String(max + 1).padStart(3, '0')}`
}

function sanitizeRegistration(registration) {
  return {
    eventId: registration.eventId,
    participation: registration.participation || 'Individual',
    teamName: registration.teamName?.trim() || '',
    teamId: registration.teamId?.trim().toUpperCase() || '',
    teamMode: registration.teamMode || 'new',
  }
}

export function EventProvider({ children }) {
  const [events, setEvents] = useState(getInitialEvents)
  const [participants, setParticipants] = useState(getInitialParticipants)
  const [teams, setTeams] = useState(getInitialTeams)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.participants, JSON.stringify(participants))
  }, [participants])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams))
  }, [teams])

  const stats = useMemo(() => {
    const totalEventRegistrations = participants.reduce(
      (count, participant) => count + participant.registrations.length,
      0,
    )

    const pendingApprovals = participants.filter((participant) => participant.status === 'pending').length

    return {
      totalEvents: events.length,
      totalParticipants: participants.length,
      totalEventRegistrations,
      pendingApprovals,
      approvedParticipants: participants.filter((participant) => participant.status === 'approved').length,
      rejectedParticipants: participants.filter((participant) => participant.status === 'rejected').length,
    }
  }, [events, participants])

  const collegeOptions = useMemo(() => {
    return [...new Set(participants.map((participant) => participant.college).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    )
  }, [participants])

  const addEvent = (payload) => {
    const name = payload.name.trim()
    const type = normalizeEventType(payload.type)

    if (!name) {
      return { ok: false, message: 'Event name is required.' }
    }

    const alreadyExists = events.some((event) => event.name.toLowerCase() === name.toLowerCase())
    if (alreadyExists) {
      return { ok: false, message: 'An event with this name already exists.' }
    }

    const newEvent = {
      id: createEventId(events),
      name,
      type,
      createdAt: new Date().toISOString(),
    }

    setEvents((prev) => [...prev, newEvent])
    return { ok: true, event: newEvent }
  }

  const deleteEvent = (eventId) => {
    const hasRegistrations = participants.some((participant) =>
      participant.registrations.some((registration) => registration.eventId === eventId),
    )

    if (hasRegistrations) {
      return {
        ok: false,
        message: 'This event has registered participants and cannot be deleted.',
      }
    }

    setEvents((prev) => prev.filter((event) => event.id !== eventId))
    return { ok: true }
  }

  const registerParticipant = (payload) => {
    const requiredFields = [payload.name, payload.college, payload.phone, payload.email]
    if (requiredFields.some((field) => !field?.trim())) {
      return { ok: false, message: 'Please fill all required candidate details.' }
    }

    const selectedRegistrations = payload.registrations
      .map(sanitizeRegistration)
      .filter((registration) => registration.eventId)

    if (selectedRegistrations.length === 0) {
      return { ok: false, message: 'Please select at least one event.' }
    }

    const uniqueEventIds = new Set(selectedRegistrations.map((registration) => registration.eventId))
    if (uniqueEventIds.size !== selectedRegistrations.length) {
      return { ok: false, message: 'The same event cannot be selected twice.' }
    }

    const pendingTeams = [...teams]
    const teamChanges = []
    const validatedRegistrations = []

    for (const registration of selectedRegistrations) {
      const event = events.find((candidateEvent) => candidateEvent.id === registration.eventId)
      if (!event) {
        return { ok: false, message: 'One or more selected events no longer exist.' }
      }

      const allowedParticipations = getParticipationOptionsByEventType(event.type)
      const resolvedParticipation = allowedParticipations.includes(registration.participation)
        ? registration.participation
        : getDefaultParticipationByEventType(event.type)

      if (resolvedParticipation === 'Team') {
        const normalizedTeamName = registration.teamName.trim()
        const teamMode = registration.teamMode || 'new'

        if (teamMode === 'join') {
          const teamIdValue = registration.teamId
          if (!teamIdValue) {
            return { ok: false, message: 'Team ID is required when joining an existing team.' }
          }

          const requestedTeam = pendingTeams.find((team) => team.id === teamIdValue)
          if (!requestedTeam) {
            return { ok: false, message: 'Team ID not found. Please check the identifier and try again.' }
          }

          if (requestedTeam.eventId !== event.id) {
            return {
              ok: false,
              message: `Team ID ${teamIdValue} does not belong to ${event.name}. Please verify the event.`,
            }
          }

          if (registration.teamName && requestedTeam.name.trim().toLowerCase() !== registration.teamName.trim().toLowerCase()) {
            return {
              ok: false,
              message: 'Team name must match the name associated with the provided team ID.',
            }
          }

          if (requestedTeam.members.length >= 4) {
            return {
              ok: false,
              message: `Team ${requestedTeam.name} already has 4 members. No more members can join.`,
            }
          }

          validatedRegistrations.push({
            ...registration,
            participation: resolvedParticipation,
            teamId: requestedTeam.id,
            teamName: requestedTeam.name,
            teamMode: 'join',
          })
          teamChanges.push({ type: 'addMember', teamId: requestedTeam.id })
          continue
        }

        if (!normalizedTeamName) {
          return { ok: false, message: `Team name is required for ${event.name}.` }
        }

        const duplicateTeamName = pendingTeams.find(
          (team) => team.eventId === event.id && team.name.trim().toLowerCase() === normalizedTeamName.toLowerCase(),
        )

        if (duplicateTeamName) {
          return {
            ok: false,
            message: `Team name "${registration.teamName}" is already registered for ${event.name}. Please join using the team ID or choose a different name.`,
          }
        }

        const newTeamId = getNextTeamId(pendingTeams)
        const newTeam = {
          id: newTeamId,
          eventId: event.id,
          eventName: event.name,
          name: normalizedTeamName,
          createdAt: new Date().toISOString(),
          members: [],
        }

        pendingTeams.push(newTeam)
        teamChanges.push({ type: 'create', team: newTeam })
        teamChanges.push({ type: 'addMember', teamId: newTeamId })

        validatedRegistrations.push({
          ...registration,
          participation: resolvedParticipation,
          teamId: newTeamId,
          teamName: normalizedTeamName,
          teamMode: 'new',
        })
        continue
      }

      validatedRegistrations.push({
        ...registration,
        participation: resolvedParticipation,
        teamName: '',
        teamId: '',
        teamMode: 'new',
      })
    }

    const candidateId = createCandidateId(participants)
    const createdAt = new Date().toISOString()

    const persistedRegistrations = validatedRegistrations.map((registration) => {
      const event = events.find((item) => item.id === registration.eventId)
      return {
        eventId: event.id,
        eventName: event.name,
        eventType: normalizeEventType(event.type),
        participation: registration.participation,
        teamName: registration.participation === 'Team' ? registration.teamName : 'Individual',
        teamId: registration.participation === 'Team' ? registration.teamId : '',
      }
    })

    const participant = {
      candidateId,
      name: payload.name.trim(),
      college: payload.college.trim(),
      phone: payload.phone.trim(),
      email: payload.email.trim(),
      status: 'pending',
      registeredAt: createdAt,
      reviewedAt: null,
      registrations: persistedRegistrations,
    }

    setParticipants((prev) => [participant, ...prev])
    setTeams((prev) => {
      let nextTeams = [...prev]
      for (const change of teamChanges) {
        if (change.type === 'create') {
          nextTeams = [...nextTeams, change.team]
        }
      }

      for (const change of teamChanges) {
        if (change.type !== 'addMember') continue
        nextTeams = nextTeams.map((team) => {
          if (team.id !== change.teamId) {
            return team
          }
          if (team.members.includes(candidateId)) {
            return team
          }
          return { ...team, members: [...team.members, candidateId] }
        })
      }

      return nextTeams
    })

    return {
      ok: true,
      participant,
      message: 'Registration submitted successfully. Await organizer approval.',
    }
  }

  const updateParticipantStatus = (candidateId, nextStatus) => {
    if (!Object.prototype.hasOwnProperty.call(PARTICIPANT_STATUS, nextStatus)) {
      return { ok: false, message: 'Invalid status update.' }
    }

    const participant = participants.find((item) => item.candidateId === candidateId)
    if (!participant) {
      return { ok: false, message: 'Participant not found.' }
    }

    if (participant.status === 'approved' && nextStatus === 'rejected') {
      return { ok: false, message: 'Approved participant cannot be rejected.' }
    }

    if (participant.status === nextStatus) {
      return { ok: true }
    }

    let isUpdated = false
    setParticipants((prev) =>
      prev.map((participant) => {
        if (participant.candidateId !== candidateId) {
          return participant
        }

        isUpdated = true
        return {
          ...participant,
          status: nextStatus,
          reviewedAt: new Date().toISOString(),
        }
      }),
    )

    if (!isUpdated) {
      return { ok: false, message: 'Participant not found.' }
    }

    return { ok: true }
  }

  const resetParticipants = () => {
    setParticipants([])
    setTeams([])
  }

  const findParticipantById = (candidateId) => {
    return participants.find((participant) => participant.candidateId === candidateId)
  }

  const value = {
    events,
    participants,
    teams,
    stats,
    collegeOptions,
    addEvent,
    deleteEvent,
    registerParticipant,
    updateParticipantStatus,
    resetParticipants,
    findParticipantById,
    participantStatuses: PARTICIPANT_STATUS,
  }

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>
}

export function useEventContext() {
  const context = useContext(EventContext)
  if (!context) {
    throw new Error('useEventContext must be used within EventProvider')
  }
  return context
}
