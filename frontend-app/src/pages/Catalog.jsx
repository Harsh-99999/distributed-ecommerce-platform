import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
// useState/useEffect imported at top — used by ProductCard below for lazy review fetch
import { useAuth } from "../auth/AuthContext";
import RecommendationStrip from "../components/RecommendationStrip";

export default function Catalog() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(16);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState(params.get("q") || "");
  const [categoryId, setCategoryId] = useState(params.get("categoryId") || "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // sync URL params (search-from-header) → local state
  useEffect(() => {
    setSearch(params.get("q") || "");
    setCategoryId(params.get("categoryId") || "");
  }, [params]);

  useEffect(() => {
    api
      .get("/api/products/categories")
      .then((r) => setCategories(r.data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const qs = new URLSearchParams({ page, size });
    if (search.trim()) qs.set("name", search.trim());
    if (categoryId) qs.set("categoryId", categoryId);
    if (minPrice) qs.set("minPrice", minPrice);
    if (maxPrice) qs.set("maxPrice", maxPrice);
    api
      .get(`/api/products?${qs.toString()}`)
      .then((r) => {
        const data = r.data || r;
        setProducts(data.content || []);
        setTotalPages(data.totalPages || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, size, search, categoryId, minPrice, maxPrice]);

  function clearFilters() {
    setSearch("");
    setCategoryId("");
    setMinPrice("");
    setMaxPrice("");
    setPage(0);
    setParams({});
  }

  const hasFilters = search || categoryId || minPrice || maxPrice;

  return (
    <div className="container">
      {user && (
        <RecommendationStrip
          title="Recommended for you"
          path={`/api/recommendations/users/${user.id}?k=6`}
        />
      )}

      <div className="filters">
        <select
          value={categoryId}
          onChange={(e) => {
            setPage(0);
            setCategoryId(e.target.value);
            const next = new URLSearchParams(params);
            if (e.target.value) next.set("categoryId", e.target.value);
            else next.delete("categoryId");
            setParams(next);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => { setPage(0); setMinPrice(e.target.value); }}
          min="0"
        />
        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => { setPage(0); setMaxPrice(e.target.value); }}
          min="0"
        />
        {search && <span className="muted">Search: <strong>{search}</strong></span>}
        {hasFilters && (
          <button className="link-btn" onClick={clearFilters}>Clear filters</button>
        )}
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && products.length === 0 && (
        <div className="empty">
          <p>No products match your filters.</p>
          {hasFilters && <button className="btn" onClick={clearFilters}>Clear filters</button>}
        </div>
      )}

      <div className="grid">
        {products.map((p, idx) => (
          <ProductCard key={p.id} product={p} highlight={idx === 0 && !hasFilters} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pager">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            ← Prev
          </button>
          <span>Page {page + 1} / {totalPages}</span>
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

function ProductCard({ product, highlight }) {
  const best = product.bestListing;
  const price = best ? best.priceAmount : product.priceAmount;
  const currency = best ? best.priceCurrency : product.priceCurrency;
  const stock = best ? best.stockQuantity : product.stockQuantity;
  const sellerName = best?.sellerName;
  const [review, setReview] = useState(null);

  // Lazy fetch review aggregate — small N+1 here is OK for the demo (16 cards/page).
  // For prod, this would be folded into the product list response server-side.
  useEffect(() => {
    let cancelled = false;
    api
      .get(`/api/products/${product.id}/reviews`)
      .then((r) => {
        if (cancelled) return;
        const list = r.data || [];
        if (list.length === 0) return;
        const avg = list.reduce((s, x) => s + x.rating, 0) / list.length;
        setReview({ avg, count: list.length });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  return (
    <Link to={`/products/${product.id}`} className="card">
      {highlight && <span className="card-bestseller">Top pick</span>}
      <div
        className="card-img"
        style={
          product.imageUrl
            ? { backgroundImage: `url(${product.imageUrl})` }
            : undefined
        }
      />
      <div className="card-body">
        <div className="card-name">{product.name}</div>
        {sellerName && <div className="card-seller">Sold by {sellerName}</div>}
        <div className="card-rating">
          {review ? (
            <>
              {"★".repeat(Math.round(review.avg))}
              {"☆".repeat(5 - Math.round(review.avg))}
              <span className="count">
                {review.avg.toFixed(1)} · {review.count}
              </span>
            </>
          ) : (
            <span className="count" style={{ color: "var(--muted)" }}>
              {product.category?.name || ""}
            </span>
          )}
        </div>
        <div className="card-price">
          {price}
          <span className="currency">{currency}</span>
        </div>
        <span className={`stock-pill ${stock === 0 ? "oos" : ""}`}>
          {stock === 0 ? "Out of stock" : `In stock (${stock})`}
        </span>
      </div>
    </Link>
  );
}
