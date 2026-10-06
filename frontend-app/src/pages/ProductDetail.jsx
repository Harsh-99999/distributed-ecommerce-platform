import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import OtherSellersPanel from "../components/OtherSellersPanel";
import RecommendationStrip from "../components/RecommendationStrip";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api
      .get(`/api/products/${id}`)
      .then((r) => setProduct(r.data || r))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    api
      .get(`/api/products/${id}/reviews`)
      .then((r) => setReviews(r.data || []))
      .catch(() => setReviews([]));
  }, [id]);

  async function onAdd() {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/products/${id}` } } });
      return;
    }
    setAdding(true);
    setAdded(false);
    setError("");
    try {
      await addItem(product.id, qty, product.bestListing?.id ?? null);
      setAdded(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="container">Loading…</div>;
  if (error && !product) return <div className="container error">{error}</div>;
  if (!product) return null;

  const best = product.bestListing;
  const price = best ? best.priceAmount : product.priceAmount;
  const currency = best ? best.priceCurrency : product.priceCurrency;
  const stock = best ? best.stockQuantity : product.stockQuantity;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="container">
      <div className="detail">
        <div
          className="detail-img"
          style={
            product.imageUrl ? { backgroundImage: `url(${product.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined
          }
        />
        <div className="detail-body">
          <p className="category-line">{product.category?.name}</p>
          <h1>{product.name}</h1>
          {avgRating && (
            <div className="detail-rating">
              {"★".repeat(Math.round(avgRating))}{"☆".repeat(5 - Math.round(avgRating))}
              <span className="count">{avgRating} · {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
            </div>
          )}
          <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            {product.description}
          </p>

          <div className="buybox">
            {best ? (
              <div className="seller-row">
                Sold by{" "}
                {best.sellerId ? (
                  <Link to={`/sellers/${best.sellerId}`}>{best.sellerName}</Link>
                ) : (
                  <strong>{best.sellerName}</strong>
                )}
                {" · ships in "}
                {best.shippingDays}d
              </div>
            ) : (
              <div className="seller-row">Platform direct</div>
            )}
            <div className="price">
              {price}
              <span className="currency">{currency}</span>
            </div>
            <div className={`stock ${stock === 0 ? "oos" : ""}`}>
              {stock === 0 ? "Out of stock" : `In stock (${stock})`}
            </div>
            <div className="qty-row">
              <label>
                Qty
                <input
                  type="number"
                  min="1"
                  max={stock || 99}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
              <button
                className="btn btn-primary"
                onClick={onAdd}
                disabled={adding || stock === 0}
              >
                {adding ? "Adding…" : stock === 0 ? "Out of stock" : "Add to Cart"}
              </button>
            </div>
            {error && <p className="error" style={{ marginTop: 10 }}>{error}</p>}
            {added && <p className="success" style={{ marginTop: 10 }}>Added to cart ✓</p>}
          </div>
        </div>
      </div>

      <OtherSellersPanel productId={product.id} />

      {reviews.length > 0 && (
        <div className="other-sellers">
          <h3>Reviews ({reviews.length})</h3>
          <ul className="reviews">
            {reviews.slice(0, 10).map((r) => (
              <li key={r.id} className="review-row">
                <div>
                  <strong style={{ color: "var(--rating)" }}>
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </strong>
                  <span className="muted" style={{ marginLeft: 8 }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.body && <p>{r.body}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <RecommendationStrip
        title="Similar products"
        path={`/api/recommendations/products/${product.id}/similar?k=6`}
      />
    </div>
  );
}
