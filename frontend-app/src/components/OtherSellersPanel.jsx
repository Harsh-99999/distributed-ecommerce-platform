import { useEffect, useState } from "react";
import { api } from "../api/client";

/**
 * Lists all active offers for a master product, sorted by buy-box score
 * (lowest price + shipping wins). Mounted in ProductDetail beside the
 * primary buy-box.
 */
export default function OtherSellersPanel({ productId }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    api
      .get(`/api/products/${productId}/listings`)
      .then((r) => setListings(r.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return null;
  if (error) return null;
  if (!listings.length) return null;

  return (
    <section className="other-sellers">
      <h3>Other sellers ({listings.length})</h3>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Seller</th>
            <th>Condition</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Ships in</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id}>
              <td><strong>{l.sellerName}</strong></td>
              <td>{l.condition}</td>
              <td>{l.priceAmount} {l.priceCurrency}</td>
              <td>{l.stockQuantity}</td>
              <td>{l.shippingDays}d</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
