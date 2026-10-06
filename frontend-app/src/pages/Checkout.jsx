import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, uuid } from "../api/client";
import { useCart } from "../cart/CartContext";

export default function Checkout() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [card, setCard] = useState({
    holderName: "Alice Demo",
    number: "4111111111111111",
    expireMonth: "12",
    expireYear: "2030",
    cvc: "123",
  });
  const [couponCode, setCouponCode] = useState("");
  const [validatedCoupon, setValidatedCoupon] = useState(null); // { code, discountAmount, finalAmount, originalAmount }
  const [validating, setValidating] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const subtotal = cart.totalAmount || 0;
  const discount = validatedCoupon ? validatedCoupon.discountAmount : 0;
  const finalTotal = subtotal - discount;
  const currency = cart.items[0]?.priceCurrency || "";

  async function applyCoupon() {
    setCouponError("");
    setValidating(true);
    try {
      const r = await api.post("/api/coupons/validate", {
        code: couponCode.trim().toUpperCase(),
        orderAmount: subtotal,
      });
      setValidatedCoupon(r.data);
    } catch (err) {
      setValidatedCoupon(null);
      setCouponError(err.message);
    } finally {
      setValidating(false);
    }
  }

  function removeCoupon() {
    setValidatedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const idemKey = uuid();
      const body = { card };
      if (validatedCoupon) body.couponCode = validatedCoupon.code;
      const r = await api.post("/api/orders", body, {
        headers: { "Idempotency-Key": idemKey },
      });
      const order = r.data || r;
      await refresh();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="container narrow">
        <p>
          Your cart is empty. <a href="/">Go shopping</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="container narrow">
      <h1>Checkout</h1>

      <section className="card">
        <h3>Order summary</h3>
        <ul className="summary">
          {cart.items.map((it) => (
            <li key={it.productId}>
              <span>
                {it.productName} × {it.quantity}
              </span>
              <span>
                {it.lineTotal} {it.priceCurrency}
              </span>
            </li>
          ))}
        </ul>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>
            {subtotal.toFixed(2)} {currency}
          </span>
        </div>
        {validatedCoupon && (
          <div className="summary-row discount">
            <span>
              Discount ({validatedCoupon.code}){" "}
              <button type="button" className="link-btn" onClick={removeCoupon}>
                remove
              </button>
            </span>
            <span>
              −{discount.toFixed(2)} {currency}
            </span>
          </div>
        )}
        <div className="summary-total">
          <span>Total</span>
          <strong>
            {finalTotal.toFixed(2)} {currency}
          </strong>
        </div>
      </section>

      <section className="card">
        <h3>Coupon</h3>
        <p className="muted">
          Try <code>WELCOME10</code> (10% off, min order 100 TRY) or <code>FLAT50TRY</code> (50 TRY
          off, min 500 TRY). One-per-user.
        </p>
        <div className="coupon-row">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Coupon code"
            disabled={!!validatedCoupon}
          />
          {validatedCoupon ? (
            <button type="button" className="btn" onClick={removeCoupon}>
              Remove
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              onClick={applyCoupon}
              disabled={validating || !couponCode.trim()}
            >
              {validating ? "Checking…" : "Apply"}
            </button>
          )}
        </div>
        {couponError && <p className="error">{couponError}</p>}
        {validatedCoupon && (
          <p className="success">
            ✓ Saved {discount.toFixed(2)} {currency}
          </p>
        )}
      </section>

      <form onSubmit={onSubmit} className="form">
        <h3>Payment</h3>
        <p className="muted">
          Test cards — number ending in <code>1115</code> simulates a decline (saga compensation
          kicks in). Any other valid format succeeds.
        </p>
        <label>
          Name on card
          <input
            value={card.holderName}
            onChange={(e) => setCard({ ...card, holderName: e.target.value })}
            required
          />
        </label>
        <label>
          Card number
          <input
            value={card.number}
            onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\s+/g, "") })}
            required
            inputMode="numeric"
          />
        </label>
        <div className="row">
          <label>
            MM
            <input
              value={card.expireMonth}
              onChange={(e) => setCard({ ...card, expireMonth: e.target.value })}
              required
              maxLength={2}
            />
          </label>
          <label>
            YYYY
            <input
              value={card.expireYear}
              onChange={(e) => setCard({ ...card, expireYear: e.target.value })}
              required
              maxLength={4}
            />
          </label>
          <label>
            CVC
            <input
              value={card.cvc}
              onChange={(e) => setCard({ ...card, cvc: e.target.value })}
              required
              maxLength={4}
            />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "Placing order…" : `Place order — ${finalTotal.toFixed(2)} ${currency}`}
        </button>
      </form>
    </div>
  );
}
