import { useEffect, useState } from "react";
import { api } from "../../api/client";

const EMPTY = {
  productId: "",
  priceAmount: "",
  priceCurrency: "TRY",
  stockQuantity: "",
  condition: "NEW",
  shippingDays: "2",
};

export default function SellerListings() {
  const [listings, setListings] = useState([]);
  const [products, setProducts] = useState([]);
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
      .get("/api/listings/me")
      .then((r) => setListings(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
    // Pull master products to choose from in the create form.
    api
      .get("/api/products?page=0&size=100")
      .then((r) => setProducts((r.data && r.data.content) || []))
      .catch(() => setProducts([]));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startCreate() {
    setForm(EMPTY);
    setFormError("");
    setShowForm(true);
  }

  async function onCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      await api.post("/api/listings", {
        productId: parseInt(form.productId, 10),
        priceAmount: parseFloat(form.priceAmount),
        priceCurrency: form.priceCurrency,
        stockQuantity: parseInt(form.stockQuantity, 10),
        condition: form.condition,
        shippingDays: parseInt(form.shippingDays, 10),
      });
      setShowForm(false);
      refresh();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function updateListing(id, patch) {
    try {
      await api.put(`/api/listings/${id}`, patch);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  async function disable(l) {
    if (!confirm(`Disable listing for product ${l.productId}?`)) return;
    try {
      await api.delete(`/api/listings/${l.id}`);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>My listings</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={startCreate}>
            + New listing
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={onCreate} className="form" style={{ marginBottom: 24 }}>
          <h3>New listing</h3>
          <div className="row">
            <label style={{ flex: 2 }}>
              Master product
              <select
                value={form.productId}
                onChange={(e) => update("productId", e.target.value)}
                required
              >
                <option value="">— pick a product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Condition
              <select
                value={form.condition}
                onChange={(e) => update("condition", e.target.value)}
              >
                <option value="NEW">NEW</option>
                <option value="USED">USED</option>
                <option value="REFURBISHED">REFURBISHED</option>
              </select>
            </label>
          </div>
          <div className="row">
            <label>
              Price
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.priceAmount}
                onChange={(e) => update("priceAmount", e.target.value)}
                required
              />
            </label>
            <label>
              Currency
              <select
                value={form.priceCurrency}
                onChange={(e) => update("priceCurrency", e.target.value)}
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
            <label>
              Stock
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => update("stockQuantity", e.target.value)}
                required
              />
            </label>
            <label>
              Shipping days
              <input
                type="number"
                min="1"
                max="30"
                value={form.shippingDays}
                onChange={(e) => update("shippingDays", e.target.value)}
                required
              />
            </label>
          </div>
          {formError && <p className="error">{formError}</p>}
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creating…" : "Create listing"}
            </button>
          </div>
        </form>
      )}

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      <table className="cart-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Condition</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Ship days</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <ListingRow
              key={l.id}
              listing={l}
              onUpdate={updateListing}
              onDisable={() => disable(l)}
            />
          ))}
          {!loading && listings.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">No listings yet — create your first one.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ListingRow({ listing, onUpdate, onDisable }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(listing.priceAmount);
  const [stock, setStock] = useState(listing.stockQuantity);

  function save() {
    onUpdate(listing.id, {
      priceAmount: parseFloat(price),
      stockQuantity: parseInt(stock, 10),
    });
    setEditing(false);
  }

  return (
    <tr>
      <td>
        #{listing.productId}
        {listing.productName ? ` ${listing.productName}` : ""}
      </td>
      <td>{listing.condition}</td>
      <td>
        {editing ? (
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ width: 100 }}
          />
        ) : (
          `${listing.priceAmount} ${listing.priceCurrency}`
        )}
      </td>
      <td>
        {editing ? (
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            style={{ width: 80 }}
          />
        ) : (
          listing.stockQuantity
        )}
      </td>
      <td>{listing.shippingDays}d</td>
      <td>
        <span className={`status status-${listing.active ? "CONFIRMED" : "CANCELLED"}`}>
          {listing.active ? "ON" : "OFF"}
        </span>
      </td>
      <td>
        {editing ? (
          <>
            <button className="link-btn" onClick={save}>Save</button>{" · "}
            <button className="link-btn" onClick={() => setEditing(false)}>Cancel</button>
          </>
        ) : (
          <>
            <button className="link-btn" onClick={() => setEditing(true)}>Edit</button>
            {listing.active && (
              <>{" · "}<button className="link-btn" onClick={onDisable}>Disable</button></>
            )}
          </>
        )}
      </td>
    </tr>
  );
}
