import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

/**
 * Allows entry only if the logged-in user has an ACTIVE seller record.
 * - Not logged in → /login
 * - Logged in but no seller record → /seller/apply
 * - Seller record but not ACTIVE (PENDING/SUSPENDED) → status page on /seller/dashboard
 */
export default function SellerRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [seller, setSeller] = useState(null);
  const [state, setState] = useState("loading"); // loading | ok | none | inactive | error

  useEffect(() => {
    if (authLoading || !user) return;
    api
      .get("/api/sellers/me")
      .then((r) => {
        const s = r.data || r;
        setSeller(s);
        setState(s.status === "ACTIVE" ? "ok" : "inactive");
      })
      .catch((e) => setState(e.status === 404 ? "none" : "error"));
  }, [user, authLoading]);

  if (authLoading || state === "loading") return <div className="container">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (state === "none") return <Navigate to="/seller/apply" replace />;
  if (state === "inactive") {
    return (
      <div className="container">
        <h1>Seller account — {seller.status}</h1>
        <p>
          {seller.status === "PENDING" &&
            "Your application is pending admin approval. Check back soon."}
          {seller.status === "SUSPENDED" &&
            "Your seller account is suspended. Contact support to reinstate."}
        </p>
      </div>
    );
  }
  if (state === "error") return <div className="container error">Failed to load seller info.</div>;
  return children;
}
