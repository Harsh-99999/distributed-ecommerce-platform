import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** Like ProtectedRoute but also requires user.role === 'ADMIN'. */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="container">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== "ADMIN") {
    return (
      <div className="container">
        <h1>Forbidden</h1>
        <p>You need ADMIN role to access this page.</p>
      </div>
    );
  }
  return children;
}
