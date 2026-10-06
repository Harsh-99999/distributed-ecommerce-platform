import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { CartProvider } from "./cart/CartContext";
import AdminRoute from "./components/AdminRoute";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import SellerRoute from "./components/SellerRoute";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminPayouts from "./pages/admin/AdminPayouts";
import AdminProductForm from "./pages/admin/AdminProductForm";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminSellers from "./pages/admin/AdminSellers";
import Cart from "./pages/Cart";
import Catalog from "./pages/Catalog";
import Checkout from "./pages/Checkout";
import Demo from "./pages/Demo";
import Login from "./pages/Login";
import { OrderDetail, OrderList } from "./pages/Orders";
import ProductDetail from "./pages/ProductDetail";
import Register from "./pages/Register";
import SellerApply from "./pages/seller/SellerApply";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerListings from "./pages/seller/SellerListings";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerStorefront from "./pages/seller/SellerStorefront";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Catalog />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrderList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <AdminRoute>
                    <AdminProducts />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/products/new"
                element={
                  <AdminRoute>
                    <AdminProductForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/products/:id/edit"
                element={
                  <AdminRoute>
                    <AdminProductForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/coupons"
                element={
                  <AdminRoute>
                    <AdminCoupons />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/sellers"
                element={
                  <AdminRoute>
                    <AdminSellers />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/payouts"
                element={
                  <AdminRoute>
                    <AdminPayouts />
                  </AdminRoute>
                }
              />
              <Route path="/sellers/:id" element={<SellerStorefront />} />
              <Route
                path="/seller/apply"
                element={
                  <ProtectedRoute>
                    <SellerApply />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/dashboard"
                element={
                  <ProtectedRoute>
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller/listings"
                element={
                  <SellerRoute>
                    <SellerListings />
                  </SellerRoute>
                }
              />
              <Route
                path="/seller/orders"
                element={
                  <SellerRoute>
                    <SellerOrders />
                  </SellerRoute>
                }
              />
              <Route path="*" element={<div className="container">Not found</div>} />
            </Routes>
          </main>
          <Footer />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
