import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api/client";

/**
 * Public storefront for one seller — visible to anyone, no auth needed.
 * /seller/:id  →  profile + their active listings + recent reviews.
 */
export default function SellerStorefront() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/api/sellers/${id}/public`).then((r) => r.data || r),
      api.get(`/api/sellers/${id}/listings`).then((r) => r.data || []),
      api.get(`/api/sellers/${id}/reviews`).then((r) => r.data || []).catch(() => []),
    ])
      .then(([p, l, r]) => {
        setProfile(p);
        setListings(l);
        setReviews(r);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container">Loading…</div>;
  if (error) return <div className="container error">{error}</div>;
  if (!profile) return null;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{profile.businessName}</h1>
          <p className="muted">
            {profile.rating ? `★ ${profile.rating} (${profile.ratingCount} reviews)` : "No reviews yet"}
            {profile.commissionPct != null && (
              <> · platform commission {profile.commissionPct}%</>
            )}
          </p>
        </div>
      </div>

      <h3>Active listings ({listings.length})</h3>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Condition</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Ships in</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id}>
              <td>
                <Link to={`/products/${l.productId}`}>
                  {l.productName || `Product #${l.productId}`}
                </Link>
              </td>
              <td>{l.condition}</td>
              <td>{l.priceAmount} {l.priceCurrency}</td>
              <td>{l.stockQuantity}</td>
              <td>{l.shippingDays}d</td>
              <td>
                <Link to={`/products/${l.productId}`}>View</Link>
              </td>
            </tr>
          ))}
          {listings.length === 0 && (
            <tr><td colSpan={6} className="muted">No active listings.</td></tr>
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: 32 }}>Recent reviews ({reviews.length})</h3>
      {reviews.length === 0 ? (
        <p className="muted">No reviews yet.</p>
      ) : (
        <ul className="reviews">
          {reviews.slice(0, 20).map((r) => (
            <li key={r.id} className="review-row">
              <div>
                <strong>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</strong>
                {" · "}
                <span className="muted">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.body && <p>{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
