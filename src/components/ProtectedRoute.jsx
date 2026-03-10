import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function ProtectedRoute({ role, children }) {
  const { authState } = useAuthContext()
  const isAllowed = role === 'admin' ? authState.admin : authState.organizer

  if (!isAllowed) {
    const loginRoute = role === 'admin' ? '/admin/login' : '/organizer/login'
    return <Navigate replace to={loginRoute} />
  }

  return children
}
