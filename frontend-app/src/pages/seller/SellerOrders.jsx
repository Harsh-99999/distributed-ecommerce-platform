import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function refresh() {
    setLoading(true);
    setError("");
    api
      .get("/api/seller-orders/me")
      .then((r) => setOrders(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  const totals = orders.reduce(
    (acc, s) => ({
      subtotal: acc.subtotal + Number(s.subtotalAmount || 0),
      commission: acc.commission + Number(s.commissionAmount || 0),
      payout: acc.payout + Number(s.payoutAmount || 0),
    }),
    { subtotal: 0, commission: 0, payout: 0 }
  );

  return (
    <div className="container">
      <div className="page-header">
        <h1>Incoming orders</h1>
        <Link to="/seller/dashboard" className="btn">← Dashboard</Link>
      </div>

      {!loading && orders.length > 0 && (
        <div className="seller-summary">
          <div className="seller-summary-card">
            <span className="muted">Sub-orders</span>
            <strong>{orders.length}</strong>
          </div>
          <div className="seller-summary-card">
            <span className="muted">Gross</span>
            <strong>{totals.subtotal.toFixed(2)}</strong>
          </div>
          <div className="seller-summary-card">
            <span className="muted">Commission</span>
            <strong>−{totals.commission.toFixed(2)}</strong>
          </div>
          <div className="seller-summary-card">
            <span className="muted">Payout</span>
            <strong>{totals.payout.toFixed(2)}</strong>
          </div>
        </div>
      )}

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      <table className="cart-table">
        <thead>
          <tr>
            <th>Sub-order</th>
            <th>Order</th>
            <th>Subtotal</th>
            <th>Commission</th>
            <th>Payout</th>
            <th>Status</th>
            <th>Placed</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((s) => (
            <SellerOrderRow key={s.id} sub={s} onChanged={() => refresh()} />
          ))}
          {!loading && orders.length === 0 && (
            <tr>
              <td colSpan={8} className="muted">No incoming orders yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SellerOrderRow({ sub, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function decide(approve) {
    if (!confirm(approve ? "Approve return (refund)?" : "Reject return?")) return;
    setBusy(true);
    setErr("");
    try {
      await api.post(`/api/seller-orders/${sub.id}/return-decision`, { approve });
      onChanged();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr>
      <td>#{sub.id}</td>
      <td>#{sub.orderId}</td>
      <td>{sub.subtotalAmount} {sub.currency}</td>
      <td className="discount-cell">−{sub.commissionAmount} ({sub.commissionPct}%)</td>
      <td><strong>{sub.payoutAmount} {sub.currency}</strong></td>
      <td><span className={`status status-${sub.status}`}>{sub.status}</span></td>
      <td>{sub.createdAt ? new Date(sub.createdAt).toLocaleString() : "—"}</td>
      <td>
        {sub.status === "RETURN_REQUESTED" && (
          <>
            <button className="link-btn" disabled={busy} onClick={() => decide(true)}>Approve</button>
            {" · "}
            <button className="link-btn" disabled={busy} onClick={() => decide(false)}>Reject</button>
          </>
        )}
        {err && <div className="error small">{err}</div>}
      </td>
    </tr>
  );
}
