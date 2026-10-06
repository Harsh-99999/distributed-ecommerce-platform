import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

/**
 * Compact horizontal product strip used in two places:
 *   <RecommendationStrip title="Similar products" path="/api/recommendations/products/5/similar?k=6" />
 *   <RecommendationStrip title="For you"          path="/api/recommendations/users/42?k=6" />
 *
 * Renders nothing if the API returns an empty list (so empty users / no similar items don't show
 * an awkward empty section).
 */
export default function RecommendationStrip({ title, path }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(path)
      .then((r) => {
        if (cancelled) return;
        setItems(r.data || []);
      })
      .catch(() => setItems([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <section className="reco-strip">
      <h3>{title}</h3>
      <div className="reco-list">
        {items.map((p) => (
          <Link to={`/products/${p.id}`} key={p.id} className="reco-card">
            <div
              className="card-img"
              style={{
                height: 100,
                marginBottom: 6,
                borderRadius: 3,
                ...(p.imageUrl ? { backgroundImage: `url(${p.imageUrl})` } : {}),
              }}
            />
            <div style={{ fontSize: 12, marginBottom: 4 }}>{p.name}</div>
            <strong style={{ color: "var(--accent)" }}>
              {p.priceAmount} <span style={{ fontSize: 11, fontWeight: 500 }}>{p.priceCurrency}</span>
            </strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
