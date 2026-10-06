import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [sellerStatus, setSellerStatus] = useState(null);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user) {
      setSellerStatus(null);
      return;
    }
    api
      .get("/api/sellers/me")
      .then((r) => setSellerStatus((r.data || r).status))
      .catch((e) => setSellerStatus(e.status === 404 ? "NONE" : null));
  }, [user]);

  useEffect(() => {
    api
      .get("/api/products/categories")
      .then((r) => setCategories((r.data || []).slice(0, 8)))
      .catch(() => setCategories([]));
  }, []);

  function onLogout() {
    logout();
    navigate("/");
  }

  function onSearch(e) {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
  }

  return (
    <header className="header">
      <div className="topbar">
        <div className="topbar-inner">
          {user ? (
            <>
              <Link to="/orders">Orders</Link>
              {sellerStatus === "NONE" && <Link to="/seller/apply">Become a Seller</Link>}
              {sellerStatus && sellerStatus !== "NONE" && <Link to="/seller/dashboard">Seller</Link>}
              {user.role === "ADMIN" && <Link to="/admin/products">Admin</Link>}
              <span className="user">{user.email}</span>
              <button onClick={onLogout} className="link-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign Up</Link>
            </>
          )}
        </div>
      </div>

      <div className="mainbar">
        <div className="mainbar-inner">
          <Link to="/" className="brand">
            shop<span className="dot">.</span>
          </Link>
          <form className="search-bar" onSubmit={onSearch}>
            <input
              type="search"
              placeholder="Search for products, brands, categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          <div className="header-right">
            <Link to="/cart" className="cart-pill">
              Cart
              {cart.itemCount > 0 && <span className="badge">{cart.itemCount}</span>}
            </Link>
          </div>
        </div>
      </div>

      <div className="nav-strip">
        <div className="nav-strip-inner">
          <NavLink to="/" end>All</NavLink>
          {categories.map((c) => (
            <NavLink key={c.id} to={`/?categoryId=${c.id}`}>{c.name}</NavLink>
          ))}
          <NavLink to="/demo" style={{ marginLeft: "auto", color: "var(--accent)" }}>
            Demo accounts
          </NavLink>
          {user?.role === "ADMIN" && (
            <>
              <span style={{ flex: 1 }} />
              <NavLink to="/admin/products">Products</NavLink>
              <NavLink to="/admin/coupons">Coupons</NavLink>
              <NavLink to="/admin/sellers">Sellers</NavLink>
              <NavLink to="/admin/payouts">Payouts</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
