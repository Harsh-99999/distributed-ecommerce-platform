import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import ReviewForm from "../components/ReviewForm";

export function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/orders")
      .then((r) => setOrders(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container">Loading…</div>;
  if (error) return <div className="container error">{error}</div>;

  return (
    <div className="container">
      <h1>Your Orders</h1>
      {orders.length === 0 ? (
        <p>You haven't placed any orders yet.</p>
      ) : (
        <table className="cart-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Status</th>
              <th>Total</th>
              <th>Placed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td className={`status status-${o.status}`}>{o.status}</td>
                <td>
                  {o.totalAmount} {o.currency}
                </td>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td>
                  <Link to={`/orders/${o.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/api/orders/${id}`)
      .then((r) => setOrder(r.data || r))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container">Loading…</div>;
  if (error) return <div className="container error">{error}</div>;
  if (!order) return null;

  return (
    <div className="container narrow">
      <h1>Order #{order.id}</h1>
      <p>
        Status:{" "}
        <span className={`status status-${order.status}`}>{order.status}</span>
      </p>
      {order.failureReason && (
        <p className="error">Reason: {order.failureReason}</p>
      )}
      <p>
        Placed: {new Date(order.createdAt).toLocaleString()} <br />
        Payment id: {order.paymentId ?? "—"}
      </p>

      <h3>Items</h3>
      {groupBySeller(order.items).map(([sellerName, items]) => {
        const first = items[0];
        const sellerId = first?.sellerId;
        return (
          <div key={sellerName || "_platform"} style={{ marginBottom: 16 }}>
            <h4 style={{ margin: "12px 0 6px" }}>
              {sellerName ? (
                sellerId ? (
                  <>Sold by <Link to={`/sellers/${sellerId}`}><strong>{sellerName}</strong></Link></>
                ) : (
                  <>Sold by <strong>{sellerName}</strong></>
                )
              ) : (
                <em className="muted">Platform</em>
              )}
            </h4>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Line</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id ?? `${it.productId}-${it.sellerId}`}>
                    <td>{it.productName}</td>
                    <td>{it.priceAmount} {it.priceCurrency}</td>
                    <td>{it.quantity}</td>
                    <td>{(it.priceAmount * it.quantity).toFixed(2)} {it.priceCurrency}</td>
                    <td>
                      {it.sellerId && order.status === "CONFIRMED" ? (
                        <ReviewForm
                          sellerId={it.sellerId}
                          productId={it.productId}
                        />
                      ) : <span className="muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {order.subOrders && order.subOrders.length > 0 && (
        <>
          <h3>Per-seller breakdown</h3>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Subtotal</th>
                <th>Commission</th>
                <th>Payout</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {order.subOrders.map((s) => (
                <SubOrderRow key={s.id} sub={s} />
              ))}
            </tbody>
          </table>
        </>
      )}

      <table className="cart-table">
        <tfoot>
          {order.subtotalAmount && order.discountAmount > 0 && (
            <>
              <tr>
                <td colSpan="3">Subtotal</td>
                <td>
                  {order.subtotalAmount} {order.currency}
                </td>
              </tr>
              <tr>
                <td colSpan="3">Discount ({order.couponCode})</td>
                <td className="discount-cell">
                  −{order.discountAmount} {order.currency}
                </td>
              </tr>
            </>
          )}
          <tr>
            <td colSpan="3">Total</td>
            <td>
              <strong>
                {order.totalAmount} {order.currency}
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>

      <p>
        <Link to="/orders">← Back to orders</Link>
      </p>
    </div>
  );
}

function SubOrderRow({ sub }) {
  const [status, setStatus] = useState(sub.status);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function requestReturn() {
    if (!confirm(`Request a return for sub-order #${sub.id}?`)) return;
    setBusy(true);
    setErr("");
    try {
      const r = await api.post(`/api/orders/sub-orders/${sub.id}/return-request`);
      setStatus((r.data || {}).status || "RETURN_REQUESTED");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr>
      <td>{sub.sellerName || <em className="muted">Platform</em>}</td>
      <td>{sub.subtotalAmount} {sub.currency}</td>
      <td className="discount-cell">
        −{sub.commissionAmount} ({sub.commissionPct}%)
      </td>
      <td><strong>{sub.payoutAmount} {sub.currency}</strong></td>
      <td><span className={`status status-${status}`}>{status}</span></td>
      <td>
        {sub.sellerId && status === "PENDING" && (
          <button className="link-btn" disabled={busy} onClick={requestReturn}>
            {busy ? "…" : "Request return"}
          </button>
        )}
        {err && <div className="error small">{err}</div>}
      </td>
    </tr>
  );
}

function groupBySeller(items) {
  const map = new Map();
  for (const it of items) {
    const key = it.sellerName || null;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  }
  // Items with sellerName first; platform/null bucket last for stable order.
  return Array.from(map.entries()).sort(([a], [b]) => {
    if (a === b) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return a.localeCompare(b);
  });
}
