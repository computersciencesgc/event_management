/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const SESSION_KEY = 'sgc_auth'

const CREDENTIALS = {
  admin: {
    username: 'admin',
    password: 'admin123',
  },
  organizer: {
    username: 'organizer',
    password: 'admin123',
  },
}

function getInitialAuth() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return {
      admin: Boolean(parsed?.admin),
      organizer: Boolean(parsed?.organizer),
    }
  } catch {
    return {
      admin: false,
      organizer: false,
    }
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(getInitialAuth)

  const persist = (next) => {
    setAuthState(next)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
  }

  const login = ({ role, username, password }) => {
    const key = role === 'admin' ? 'admin' : 'organizer'
    const expected = CREDENTIALS[key]

    if (username.trim() !== expected.username || password.trim() !== expected.password) {
      return {
        ok: false,
        message: 'Invalid username or password.',
      }
    }

    const nextState = {
      ...authState,
      [key]: true,
    }

    persist(nextState)

    return {
      ok: true,
      message: 'Logged in successfully.',
    }
  }

  const logout = (role) => {
    const key = role === 'admin' ? 'admin' : 'organizer'
    const nextState = {
      ...authState,
      [key]: false,
    }

    persist(nextState)
  }

  const clearAll = () => {
    const cleared = {
      admin: false,
      organizer: false,
    }
    persist(cleared)
  }

  const value = {
    authState,
    login,
    logout,
    clearAll,
    credentials: CREDENTIALS,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
