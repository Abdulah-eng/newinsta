import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireSubscription?: boolean
}

const ProtectedRoute = ({ children, requireAdmin = false, requireSubscription = false }: ProtectedRouteProps) => {
  const { user, profile, loading, subscribed } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gold text-xl font-serif">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !profile?.is_admin) {
    return <Navigate to="/portal" replace />
  }

  if (requireSubscription && !subscribed) {
    return <Navigate to="/membership" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute