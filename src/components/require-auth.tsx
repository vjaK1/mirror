import { Navigate, Outlet } from "react-router"
import { useAuth } from "@/components/auth-provider"
import { SplashScreen } from "@/components/splash-screen"

/** Nothing inside renders without a session (CLAUDE.md: protected routes). */
export function RequireAuth() {
  const { session, loading } = useAuth()

  if (loading) return <SplashScreen />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
