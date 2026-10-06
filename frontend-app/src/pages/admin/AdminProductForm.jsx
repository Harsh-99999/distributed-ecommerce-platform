import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    imageUrl: "",
    priceAmount: "",
    priceCurrency: "TRY",
    stockQuantity: "",
    categoryId: "",
    enabled: true,
  });
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/products/categories")
      .then((r) => setCategories(r.data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/api/products/${id}`)
      .then((r) => {
        const p = r.data || r;
        setForm({
          sku: p.sku || "",
          name: p.name || "",
          description: p.description || "",
          imageUrl: p.imageUrl || "",
          priceAmount: String(p.priceAmount ?? ""),
          priceCurrency: p.priceCurrency || "TRY",
          stockQuantity: String(p.stockQuantity ?? ""),
          categoryId: p.category?.id ? String(p.category.id) : "",
          enabled: !!p.enabled,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const body = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      imageUrl: form.imageUrl || null,
      priceAmount: parseFloat(form.priceAmount),
      priceCurrency: form.priceCurrency,
      stockQuantity: parseInt(form.stockQuantity, 10),
      categoryId: parseInt(form.categoryId, 10),
    };
    try {
      if (isEdit) {
        await api.put(`/api/products/${id}`, { ...body, enabled: form.enabled });
      } else {
        await api.post("/api/products", body);
      }
      navigate("/admin/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container">Loading…</div>;

  return (
    <div className="container narrow">
      <h1>{isEdit ? `Edit product #${id}` : "New product"}</h1>
      <form onSubmit={onSubmit} className="form">
        <label>
          SKU
          <input
            value={form.sku}
            onChange={(e) => update("sku", e.target.value)}
            required
            disabled={isEdit}
          />
        </label>
        <label>
          Name
          <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </label>
        <label>
          Description
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
          />
        </label>
        <label>
          Image URL
          <input
            value={form.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
            type="url"
            placeholder="https://…"
          />
        </label>
        <div className="row">
          <label>
            Price
            <input
              type="number"
              step="0.01"
              value={form.priceAmount}
              onChange={(e) => update("priceAmount", e.target.value)}
              required
            />
          </label>
          <label>
            Currency
            <input
              value={form.priceCurrency}
              onChange={(e) => update("priceCurrency", e.target.value.toUpperCase())}
              maxLength={3}
              required
            />
          </label>
          <label>
            Stock
            <input
              type="number"
              value={form.stockQuantity}
              onChange={(e) => update("stockQuantity", e.target.value)}
              required
            />
          </label>
        </div>
        <label>
          Category
          <select
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            required
          >
            <option value="">— Select —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {isEdit && (
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => update("enabled", e.target.checked)}
            />
            Enabled (shown in catalog)
          </label>
        )}
        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </div>
  );
}
