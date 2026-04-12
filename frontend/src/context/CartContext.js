import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setItems([]);
    }
  }, [isAuthenticated, user]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await cartAPI.getCart();
      setItems(res.data.cart.items || []);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = useCallback(async (product, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    try {
      const res = await cartAPI.addItem(product._id, quantity);
      setItems(res.data.cart.items || []);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    }
  }, [isAuthenticated]);

  const removeItem = useCallback(async (productId) => {
    const id = productId?._id || productId; // ✅
    try {
      const res = await cartAPI.removeItem(id);
      setItems(res.data.cart.items || []);
    } catch (err) {
      toast.error('Failed to remove item');
    }
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity < 1) return;
    const id = productId?._id || productId; // ✅
    try {
      const res = await cartAPI.updateItem(id, quantity);
      setItems(res.data.cart.items || []);
    } catch (err) {
      toast.error('Failed to update quantity');
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await cartAPI.clearCart();
      setItems([]);
    } catch (err) {
      toast.error('Failed to clear cart');
    }
  }, []);

  const total     = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const isEmpty   = items.length === 0;

  return (
    <CartContext.Provider value={{
      items, total, itemCount, isEmpty, loading,
      addItem, removeItem, updateQuantity, clearCart, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};