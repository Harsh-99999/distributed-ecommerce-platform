import { useEffect, useState } from "react";
import { api } from "../../api/client";

function lastWeek() {
  const end = new Date();
  end.setDate(end.getDate() + 1); // include today, exclusive end
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function AdminPayouts() {
  const initial = lastWeek();
  const [periodStart, setPeriodStart] = useState(initial.start);
  const [periodEnd, setPeriodEnd] = useState(initial.end);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState("");

  function refresh() {
    setLoading(true);
    setError("");
    api
      .get("/api/admin/payouts")
      .then((r) => setPayouts(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function runNow() {
    setRunning(true);
    setRunMsg("");
    try {
      const r = await api.post("/api/admin/payouts/run", { periodStart, periodEnd });
      const created = r.data || [];
      setRunMsg(
        created.length === 0
          ? "No eligible sub-orders in that range."
          : `Created ${created.length} payout(s).`
      );
      refresh();
    } catch (e) {
      setRunMsg("Failed: " + e.message);
    } finally {
      setRunning(false);
    }
  }

  async function markPaid(p) {
    if (!confirm(`Mark payout #${p.id} (net ${p.netAmount} ${p.currency}) as PAID?`)) return;
    try {
      await api.post(`/api/admin/payouts/${p.id}/mark-paid`);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="container">
      <h1>Admin — Payouts</h1>

      <div className="form" style={{ marginBottom: 24 }}>
        <h3>Run payout for period</h3>
        <div className="row">
          <label>
            From
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </label>
          <label>
            To (exclusive)
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </label>
          <button className="btn btn-primary" onClick={runNow} disabled={running}>
            {running ? "Running…" : "Run payout"}
          </button>
        </div>
        {runMsg && <p>{runMsg}</p>}
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      <table className="cart-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Seller</th>
            <th>Period</th>
            <th>Sub-orders</th>
            <th>Gross</th>
            <th>Commission</th>
            <th>Net</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <tr key={p.id}>
              <td>#{p.id}</td>
              <td>#{p.sellerId}</td>
              <td>{p.periodStart} → {p.periodEnd}</td>
              <td>{p.subOrderCount}</td>
              <td>{p.grossAmount} {p.currency}</td>
              <td className="discount-cell">−{p.commissionAmount}</td>
              <td><strong>{p.netAmount}</strong></td>
              <td>
                <span className={`status status-${p.status === "PAID" ? "CONFIRMED" : "PENDING"}`}>
                  {p.status}
                </span>
              </td>
              <td>
                {p.status !== "PAID" && (
                  <button className="link-btn" onClick={() => markPaid(p)}>Mark paid</button>
                )}
              </td>
            </tr>
          ))}
          {!loading && payouts.length === 0 && (
            <tr><td colSpan={9} className="muted">No payouts yet — run one for last week.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
