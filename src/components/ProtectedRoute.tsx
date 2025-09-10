import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useState, useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireSubscription?: boolean
}

const ProtectedRoute = ({ children, requireAdmin = false, requireSubscription = false }: ProtectedRouteProps) => {
  const { user, profile, loading, subscribed } = useAuth()

  // Add a timeout to prevent infinite loading
  const [timeoutReached, setTimeoutReached] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true)
    }, 15000) // 15 second timeout

    return () => clearTimeout(timer)
  }, [])

  // Reset timeout when loading state changes
  useEffect(() => {
    if (!loading) {
      setTimeoutReached(false)
    }
  }, [loading])

  if (loading && !timeoutReached) {
    return <LoadingSpinner message="Checking access..." />
  }

  // If loading has taken too long, show error or redirect
  if (loading && timeoutReached) {
    console.error('Loading timeout reached in ProtectedRoute')
    return <Navigate to="/login" replace />
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