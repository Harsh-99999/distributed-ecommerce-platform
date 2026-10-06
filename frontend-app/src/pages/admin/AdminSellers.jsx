import { useEffect, useState } from "react";
import { api } from "../../api/client";

const STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"];

export default function AdminSellers() {
  const [status, setStatus] = useState("PENDING");
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function refresh() {
    setLoading(true);
    setError("");
    api
      .get(`/api/sellers/admin?status=${status}`)
      .then((r) => setSellers(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [status]);

  async function transition(seller, newStatus) {
    if (!confirm(`Set seller ${seller.businessName} (#${seller.id}) to ${newStatus}?`)) return;
    try {
      await api.patch(`/api/sellers/admin/${seller.id}`, { status: newStatus });
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin — Sellers</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      <table className="cart-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Business</th>
            <th>Tax ID</th>
            <th>IBAN</th>
            <th>Commission</th>
            <th>Created</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sellers.map((s) => (
            <tr key={s.id}>
              <td>#{s.id}</td>
              <td>{s.businessName}</td>
              <td>{s.taxId}</td>
              <td>{s.iban}</td>
              <td>{s.commissionPct}%</td>
              <td>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}</td>
              <td>
                <span className={`status status-${s.status === "ACTIVE" ? "CONFIRMED" : s.status === "SUSPENDED" ? "CANCELLED" : "PENDING"}`}>
                  {s.status}
                </span>
              </td>
              <td>
                {s.status === "PENDING" && (
                  <>
                    <button className="link-btn" onClick={() => transition(s, "ACTIVE")}>Approve</button>{" · "}
                    <button className="link-btn" onClick={() => transition(s, "SUSPENDED")}>Reject</button>
                  </>
                )}
                {s.status === "ACTIVE" && (
                  <button className="link-btn" onClick={() => transition(s, "SUSPENDED")}>Suspend</button>
                )}
                {s.status === "SUSPENDED" && (
                  <button className="link-btn" onClick={() => transition(s, "ACTIVE")}>Reinstate</button>
                )}
              </td>
            </tr>
          ))}
          {!loading && sellers.length === 0 && (
            <tr>
              <td colSpan={8} className="muted">No sellers in {status} state.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
