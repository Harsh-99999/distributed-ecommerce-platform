import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/**
 * One-click login switcher for demo / video walkthrough.
 *
 * The seed script (`scripts/seed/seed.js` in the backend repo) creates exactly
 * these accounts — same email + password for everyone. If you bumped the count
 * during seeding, edit the arrays below.
 */
const ADMINS = [
  {
    email: "alice@example.com",
    name: "Alice (Platform Admin)",
    description: "Full admin: manage products, coupons, sellers, payouts.",
    landingUrl: "/admin/products",
    color: "#7c2d12",
  },
];

const SELLERS = [
  {
    email: "seller1@example.com",
    name: "TechMart Elektronik",
    description: "Active seller — manage listings, see incoming orders.",
    landingUrl: "/seller/dashboard",
    color: "#0c4a6e",
  },
  {
    email: "seller2@example.com",
    name: "Moda Home",
    description: "Active seller — fashion + home category listings.",
    landingUrl: "/seller/dashboard",
    color: "#0c4a6e",
  },
  {
    email: "seller3@example.com",
    name: "Kitap Dünyası",
    description: "Active seller — books category.",
    landingUrl: "/seller/dashboard",
    color: "#0c4a6e",
  },
  {
    email: "seller4@example.com",
    name: "Sport Center",
    description: "Active seller — sports + fitness.",
    landingUrl: "/seller/dashboard",
    color: "#0c4a6e",
  },
  {
    email: "seller5@example.com",
    name: "MegaShop",
    description: "Active seller — multi-category outlet.",
    landingUrl: "/seller/dashboard",
    color: "#0c4a6e",
  },
];

const BUYERS = [
  {
    email: "buyer1@example.com",
    name: "Buyer #1",
    description: "Regular customer — browses catalog, places orders.",
    landingUrl: "/",
    color: "#14532d",
  },
  {
    email: "buyer2@example.com",
    name: "Buyer #2",
    description: "Regular customer with order history.",
    landingUrl: "/orders",
    color: "#14532d",
  },
  {
    email: "buyer3@example.com",
    name: "Buyer #3",
    description: "Regular customer.",
    landingUrl: "/",
    color: "#14532d",
  },
];

const PASSWORD = "password123";

export default function Demo() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function loginAs(account) {
    setBusy(account.email);
    setError("");
    try {
      await login(account.email, PASSWORD);
      navigate(account.landingUrl);
    } catch (e) {
      setError(`Failed to log in as ${account.email}: ${e.message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Demo accounts</h1>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="muted small">
              currently signed in as <strong>{user.email}</strong>
              {user.role === "ADMIN" && <> · ADMIN</>}
            </span>
            <button className="btn" onClick={() => { logout(); navigate("/demo"); }}>
              Sign out
            </button>
          </div>
        )}
      </div>

      <p className="muted">
        Click any account below to log in instantly and jump to the relevant page.
        All passwords are <code>{PASSWORD}</code>.
        These accounts come from <code>scripts/seed/seed.js</code> — run it once
        before the demo to populate products, sellers, listings and reviews.
      </p>

      {error && <p className="error">{error}</p>}

      <Section title="Admin" subtitle="Full platform privileges" accounts={ADMINS} onLogin={loginAs} busy={busy} currentEmail={user?.email} />
      <Section title="Sellers" subtitle="Sell on the marketplace, manage listings + incoming orders" accounts={SELLERS} onLogin={loginAs} busy={busy} currentEmail={user?.email} />
      <Section title="Buyers" subtitle="Regular customers — browse, cart, checkout, review" accounts={BUYERS} onLogin={loginAs} busy={busy} currentEmail={user?.email} />

      <h3 style={{ marginTop: 32 }}>Suggested demo flow for a video</h3>
      <ol className="muted" style={{ lineHeight: 1.8 }}>
        <li><strong>Buyer flow</strong>: log in as <code>buyer1</code> → browse catalog → click a product → see "Sold by …" link → add to cart → checkout</li>
        <li><strong>Order detail</strong>: stay logged in → orders page → expand an order → see per-seller breakdown + commission + leave a review</li>
        <li><strong>Seller flow</strong>: switch to <code>seller1</code> (TechMart) → dashboard → incoming orders shows the order you just placed → manage listings → adjust price/stock</li>
        <li><strong>Storefront</strong>: from any page, click a "Sold by …" link → public seller storefront with listings + reviews</li>
        <li><strong>Admin flow</strong>: switch to <code>alice</code> → /admin/sellers (approve/suspend) → /admin/payouts (run weekly payout) → /admin/coupons → /admin/products</li>
        <li><strong>Returns</strong>: switch back to a buyer → request a return on an open sub-order → switch to the right seller → approve/reject the return</li>
      </ol>
    </div>
  );
}

function Section({ title, subtitle, accounts, onLogin, busy, currentEmail }) {
  return (
    <section style={{ marginTop: 24 }}>
      <h3 style={{ margin: "0 0 4px" }}>{title}</h3>
      <p className="muted small" style={{ marginTop: 0 }}>{subtitle}</p>
      <div className="demo-grid">
        {accounts.map((a) => (
          <div
            key={a.email}
            className="demo-card"
            style={{ borderLeft: `4px solid ${a.color}` }}
          >
            <div className="demo-card-head">
              <strong>{a.name}</strong>
              {currentEmail === a.email && (
                <span className="status status-CONFIRMED">SIGNED IN</span>
              )}
            </div>
            <code className="muted small">{a.email}</code>
            <p className="small" style={{ margin: "6px 0 10px" }}>{a.description}</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onLogin(a)}
              disabled={busy === a.email}
            >
              {busy === a.email ? "Signing in…" : `Login & go to ${a.landingUrl} →`}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
