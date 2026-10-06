import { useEffect, useState } from "react";
import { api } from "../../api/client";

const EMPTY = {
  code: "",
  discountType: "PERCENT",
  discountValue: "",
  minOrderAmount: "",
  maxUses: "",
  validUntil: "",
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function refresh() {
    setLoading(true);
    setError("");
    api
      .get("/api/coupons")
      .then((r) => setCoupons(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startCreate() {
    setForm(EMPTY);
    setFormError("");
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setFormError("");
  }

  async function onCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    const body = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
      maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
    };
    try {
      await api.post("/api/coupons", body);
      setShowForm(false);
      refresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function disable(c) {
    if (!confirm(`Disable coupon ${c.code}?`)) return;
    try {
      await api.delete(`/api/coupons/${c.id}`);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  async function toggleActive(c) {
    try {
      await api.put(`/api/coupons/${c.id}`, { active: !c.active });
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin — Coupons</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={startCreate}>
            + New coupon
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={onCreate} className="form" style={{ marginBottom: 24 }}>
          <h3>New coupon</h3>
          <div className="row">
            <label style={{ flex: 2 }}>
              Code (uppercase)
              <input
                value={form.code}
                onChange={(e) => update("code", e.target.value)}
                required
                pattern="[A-Za-z0-9_-]+"
                placeholder="SUMMER20"
              />
            </label>
            <label>
              Type
              <select
                value={form.discountType}
                onChange={(e) => update("discountType", e.target.value)}
              >
                <option value="PERCENT">PERCENT (%)</option>
                <option value="FIXED">FIXED (TRY)</option>
              </select>
            </label>
            <label>
              Value
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.discountValue}
                onChange={(e) => update("discountValue", e.target.value)}
                required
              />
            </label>
          </div>
          <div className="row">
            <label>
              Min order amount (optional)
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.minOrderAmount}
                onChange={(e) => update("minOrderAmount", e.target.value)}
              />
            </label>
            <label>
              Max uses (optional, blank = unlimited)
              <input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(e) => update("maxUses", e.target.value)}
              />
            </label>
            <label>
              Valid until (optional)
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) => update("validUntil", e.target.value)}
              />
            </label>
          </div>
          {formError && <p className="error">{formError}</p>}
          <div className="form-actions">
            <button type="button" className="btn" onClick={cancel}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create coupon"}
            </button>
          </div>
        </form>
      )}

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      <table className="cart-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Min order</th>
            <th>Used / Max</th>
            <th>Valid until</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id}>
              <td>
                <code>{c.code}</code>
              </td>
              <td>{c.discountType}</td>
              <td>
                {c.discountValue}
                {c.discountType === "PERCENT" ? " %" : " TRY"}
              </td>
              <td>{c.minOrderAmount ?? "—"}</td>
              <td>
                {c.usedCount} / {c.maxUses ?? "∞"}
              </td>
              <td>{c.validUntil ? new Date(c.validUntil).toLocaleDateString() : "—"}</td>
              <td>
                <span
                  className={`status status-${c.active ? "CONFIRMED" : "CANCELLED"}`}
                >
                  {c.active ? "ON" : "OFF"}
                </span>
              </td>
              <td>
                <button className="link-btn" onClick={() => toggleActive(c)}>
                  {c.active ? "Disable" : "Enable"}
                </button>
                {" · "}
                <button className="link-btn" onClick={() => disable(c)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
