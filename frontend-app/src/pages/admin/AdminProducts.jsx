import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function refresh() {
    setLoading(true);
    setError("");
    api
      .get(`/api/products?page=${page}&size=${size}`)
      .then((r) => {
        const d = r.data || r;
        setProducts(d.content || []);
        setTotalPages(d.totalPages || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [page, size]);

  async function softDelete(id) {
    if (!confirm(`Disable product #${id}?`)) return;
    try {
      await api.delete(`/api/products/${id}`);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin — Products</h1>
        <button className="btn btn-primary" onClick={() => navigate("/admin/products/new")}>
          + New product
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      <table className="cart-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>SKU</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock (live)</th>
            <th>Enabled</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>
                <code>{p.sku}</code>
              </td>
              <td>{p.name}</td>
              <td className="muted">{p.category?.name}</td>
              <td>
                {p.priceAmount} {p.priceCurrency}
              </td>
              <td>{p.stockQuantity}</td>
              <td>
                <span
                  className={`status status-${p.enabled ? "CONFIRMED" : "CANCELLED"}`}
                >
                  {p.enabled ? "ON" : "OFF"}
                </span>
              </td>
              <td>
                <Link to={`/admin/products/${p.id}/edit`}>Edit</Link>
                {" · "}
                <button className="link-btn" onClick={() => softDelete(p.id)}>
                  Disable
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pager">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            ← Prev
          </button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
