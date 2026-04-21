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
    return false;
  }

  if (!product?.isUnlimited) {
const stock = Number(product?.availableStock ?? product?.stock ?? 0);
    if (stock <= 0) {
      toast.error('Product is out of stock');
      return false;
    }
  }

  // Optimistic Update + Toast فوراً
  const prevItems = items;
  setItems(prev => {
    const existing = prev.find(i => (i.product?._id || i.product) === product._id);
    if (existing) {
      return prev.map(i =>
        (i.product?._id || i.product) === product._id
          ? { ...i, quantity: i.quantity + quantity }
          : i
      );
    }
    return [...prev, {
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      category: product.category,
      quantity,
    }];
  });

  // Toast
  toast.success(
    `Added ${quantity > 1 ? quantity + 'x ' : ''}${product.name} to cart`,
    {
      id: 'cart-toast',
      duration: 2000,
      style: {
        background: '#1a1a1a',
        color: '#fff',
        border: '1px solid #22c55e',
        fontSize: '14px',
        fontFamily: 'Outfit, sans-serif'
      }
    }
  );

  try {
    const res = await cartAPI.addItem(product._id, quantity);
    setItems(res.data.cart.items || []);
    return true;
  } catch (err) {
    setItems(prevItems);
    toast.error(err.response?.data?.message || 'Failed to add item', { id: 'cart-toast' });
    return false;
  }
}, [isAuthenticated, items]);

const removeItem = useCallback(async (productId) => {
  const id = productId?._id || productId;
  const prevItems = items;

  setItems(prev => prev.filter(i => {
    const pid = i.product?._id?.toString() || i.product?.toString();
    return pid !== id.toString() && i._id?.toString() !== id.toString();
  }));

  try {
    const res = await cartAPI.removeItem(id);
    setItems(res.data.cart.items || []);
  } catch (err) {
    setItems(prevItems);
    toast.error('Failed to remove item');
  }
}, [items]);

const updateQuantity = useCallback(async (productId, quantity) => {
  if (quantity < 1) return;
  const id = productId?._id || productId;
  const prevItems = items;

  setItems(prev => prev.map(i => {
    const pid = i.product?._id?.toString() || i.product?.toString();
    const match = pid === id.toString() || i._id?.toString() === id.toString();
    return match ? { ...i, quantity } : i;
  }));

  // 
  toast.success('Cart updated', {
    id: 'cart-toast',
    duration: 1500,
    style: {
      background: '#1a1a1a',
      color: '#fff',
      border: '1px solid #22c55e',
      fontSize: '14px',
      fontFamily: 'Outfit, sans-serif'
    }
  });

  try {
    const res = await cartAPI.updateItem(id, quantity);
    setItems(res.data.cart.items || []);
  } catch (err) {
    setItems(prevItems);
    toast.error('Failed to update quantity', { id: 'cart-toast' });
  }
}, [items]);
  const clearCart = useCallback(async () => {
    const prevItems = items;
    setItems([]);
    try {
      await cartAPI.clearCart();
    } catch (err) {
      setItems(prevItems); // rollback
      toast.error('Failed to clear cart');
    }
  }, [items]);

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