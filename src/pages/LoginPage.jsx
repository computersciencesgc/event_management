import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CollegeBrand from '../components/CollegeBrand'
import { useAuthContext } from '../context/AuthContext'

const ROLE_MAP = {
  admin: {
    title: 'Admin Login',
    description: 'Login to manage events and filter candidate records.',
    route: '/admin',
    username: 'admin',
  },
  organizer: {
    title: 'Organizer Login',
    description: 'Login to approve registered candidates.',
    route: '/organizer',
    username: 'organizer',
  },
}

export default function LoginPage({ role }) {
  const navigate = useNavigate()
  const { authState, login } = useAuthContext()
  const [form, setForm] = useState({ username: '', password: '' })
  const [message, setMessage] = useState(null)

  const config = ROLE_MAP[role] ?? ROLE_MAP.organizer
  const isLoggedIn = role === 'admin' ? authState.admin : authState.organizer

  useEffect(() => {
    if (isLoggedIn) {
      navigate(config.route, { replace: true })
    }
  }, [config.route, isLoggedIn, navigate])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = (event) => {
    event.preventDefault()
    const result = login({ role, username: form.username, password: form.password })

    if (!result.ok) {
      setMessage({ type: 'error', text: result.message })
      return
    }

    setMessage({ type: 'success', text: result.message })
    navigate(config.route)
  }

  return (
    <main className="page-shell">
      <section className="panel login-panel">
        <CollegeBrand contextText="College Event Management" />
        <h1>{config.title}</h1>
        <p className="muted">{config.description}</p>

        {message ? (
          <p className={`alert ${message.type === 'success' ? 'success' : 'error'}`}>{message.text}</p>
        ) : null}

        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            Username
            <input
              autoComplete="username"
              name="username"
              onChange={onChange}
              placeholder="Enter username"
              required
              type="text"
              value={form.username}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="current-password"
              name="password"
              onChange={onChange}
              placeholder="Enter password"
              required
              type="password"
              value={form.password}
            />
          </label>

          <div className="button-row">
            <button className="btn btn-primary" type="submit">
              Login
            </button>
            <Link className="btn btn-dark" to="/">
              Back to Home
            </Link>
          </div>
        </form>

      </section>
    </main>
  )
}
