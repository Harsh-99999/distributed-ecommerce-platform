import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";

export default function SellerDashboard() {
  const [seller, setSeller] = useState(null);
  const [listingCount, setListingCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/sellers/me").then((r) => r.data || r),
      api.get("/api/listings/me").then((r) => (r.data || r).length).catch(() => 0),
    ])
      .then(([s, count]) => {
        setSeller(s);
        setListingCount(count);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container">Loading…</div>;
  if (error) return <div className="container error">{error}</div>;
  if (!seller) return null;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Seller dashboard</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Link to="/seller/orders" className="btn">Incoming orders</Link>
          <Link to="/seller/listings" className="btn btn-primary">Manage listings</Link>
        </div>
      </div>

      <div className="seller-summary">
        <div className="seller-summary-card">
          <span className="muted">Status</span>
          <strong>
            <span className={`status status-${seller.status === "ACTIVE" ? "CONFIRMED" : "CANCELLED"}`}>
              {seller.status}
            </span>
          </strong>
        </div>
        <div className="seller-summary-card">
          <span className="muted">Business</span>
          <strong>{seller.businessName}</strong>
        </div>
        <div className="seller-summary-card">
          <span className="muted">Commission</span>
          <strong>{seller.commissionPct}%</strong>
        </div>
        <div className="seller-summary-card">
          <span className="muted">Listings</span>
          <strong>{listingCount ?? 0}</strong>
        </div>
        <div className="seller-summary-card">
          <span className="muted">Rating</span>
          <strong>{seller.ratingAvg ? `${seller.ratingAvg}/5` : "—"}</strong>
        </div>
      </div>

      <h3 style={{ marginTop: 32 }}>Profile</h3>
      <table className="cart-table">
        <tbody>
          <tr><td>Tax ID</td><td>{seller.taxId}</td></tr>
          <tr><td>IBAN</td><td>{seller.iban}</td></tr>
          <tr><td>Contact email</td><td>{seller.contactEmail || "—"}</td></tr>
          <tr><td>Contact phone</td><td>{seller.contactPhone || "—"}</td></tr>
          <tr><td>Member since</td><td>{seller.createdAt ? new Date(seller.createdAt).toLocaleDateString() : "—"}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
