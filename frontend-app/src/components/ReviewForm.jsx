import { useState } from "react";
import { api } from "../api/client";

/**
 * Inline review form — used on order detail per item that has a sellerId.
 * On submit, POSTs to /api/reviews and notifies the parent via onSubmitted.
 */
export default function ReviewForm({ sellerId, productId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/reviews", { sellerId, productId, rating, body: body.trim() || null });
      setDone(true);
      if (onSubmitted) onSubmitted();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <p className="success small">Thanks — your review has been saved.</p>;

  return (
    <form onSubmit={submit} className="review-form">
      <label>
        Rating
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          <option value={5}>★★★★★ (5)</option>
          <option value={4}>★★★★☆ (4)</option>
          <option value={3}>★★★☆☆ (3)</option>
          <option value={2}>★★☆☆☆ (2)</option>
          <option value={1}>★☆☆☆☆ (1)</option>
        </select>
      </label>
      <textarea
        rows={2}
        placeholder="Optional comment"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={2000}
      />
      {error && <span className="error small">{error}</span>}
      <button className="btn btn-primary btn-sm" disabled={submitting}>
        {submitting ? "…" : "Save review"}
      </button>
    </form>
  );
}
