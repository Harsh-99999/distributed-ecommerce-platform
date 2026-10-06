import { Link } from "react-router-dom";
import { useCart } from "../cart/CartContext";

export default function Cart() {
  const { cart, loading, removeItem, clearCart } = useCart();

  if (loading) return <div className="container">Loading…</div>;

  const empty = !cart.items || cart.items.length === 0;

  return (
    <div className="container">
      <h1>Your Cart</h1>
      {empty ? (
        <div className="empty">
          <p>Cart is empty.</p>
          <Link to="/" className="btn btn-primary">Browse catalog</Link>
        </div>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Line total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((it) => (
                <tr key={it.productId}>
                  <td>
                    <Link to={`/products/${it.productId}`}>{it.productName}</Link>
                    {it.sellerName && (
                      <div className="muted small">
                        Sold by{" "}
                        {it.sellerId ? (
                          <Link to={`/sellers/${it.sellerId}`}><strong>{it.sellerName}</strong></Link>
                        ) : (
                          <strong>{it.sellerName}</strong>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {it.priceAmount} {it.priceCurrency}
                  </td>
                  <td>{it.quantity}</td>
                  <td>
                    {it.lineTotal} {it.priceCurrency}
                  </td>
                  <td>
                    <button className="link-btn" onClick={() => removeItem(it.productId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3">Total</td>
                <td colSpan="2">
                  <strong>
                    {cart.totalAmount} {cart.items[0]?.priceCurrency || ""}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
          <div className="cart-actions">
            <button className="link-btn" onClick={clearCart}>Clear cart</button>
            <Link to="/checkout" className="btn btn-primary">Checkout →</Link>
          </div>
        </>
      )}
    </div>
  );
}
