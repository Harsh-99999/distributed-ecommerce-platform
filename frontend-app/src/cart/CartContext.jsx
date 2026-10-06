import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], itemCount: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart({ items: [], itemCount: 0, totalAmount: 0 });
      return;
    }
    setLoading(true);
    try {
      const r = await api.get("/api/cart");
      setCart(r.data || { items: [], itemCount: 0, totalAmount: 0 });
    } catch (e) {
      console.error("cart refresh", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addItem(productId, quantity = 1, listingId = null) {
    await api.post("/api/cart/items", { productId, quantity, listingId });
    await refresh();
  }

  async function removeItem(productId) {
    await api.delete(`/api/cart/items/${productId}`);
    await refresh();
  }

  async function clearCart() {
    await api.delete("/api/cart");
    await refresh();
  }

  return (
    <CartContext.Provider
      value={{ cart, loading, refresh, addItem, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
