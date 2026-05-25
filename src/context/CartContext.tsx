import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem, Product } from '../types';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useConfig } from './ConfigContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size: number, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateSize: (cartItemId: string, size: number) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'joias_naturais_cart';

// Helper to determine if remote items match current state
const isCartEqual = (cartA: CartItem[], cartB: CartItem[]): boolean => {
  if (cartA.length !== cartB.length) return false;
  return cartA.every((itemA, index) => {
    const itemB = cartB[index];
    return (
      itemB &&
      itemA.id === itemB.id &&
      itemA.productId === itemB.productId &&
      itemA.size === itemB.size &&
      itemA.quantity === itemB.quantity &&
      itemA.price === itemB.price
    );
  });
};

// Helper to merge local shopping carts to live server carts
const mergeCarts = (local: CartItem[], remote: CartItem[]): CartItem[] => {
  const merged = [...remote];
  local.forEach((localItem) => {
    const remoteIndex = merged.findIndex(
      (remoteItem) => remoteItem.productId === localItem.productId && remoteItem.size === localItem.size
    );
    if (remoteIndex > -1) {
      merged[remoteIndex] = {
        ...merged[remoteIndex],
        quantity: merged[remoteIndex].quantity + localItem.quantity,
      };
    } else {
      merged.push(localItem);
    }
  });
  return merged;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { config } = useConfig();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  
  const isFromRemote = useRef(false);
  const cartRef = useRef<CartItem[]>(cart);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Load cart from localStorage on init
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cart]);

  // Real-time Firestore synchronization effect
  useEffect(() => {
    if (!user) {
      setInitialSyncDone(false);
      return;
    }

    let unsub: () => void;

    const initUserCart = async () => {
      try {
        const userCartRef = doc(db, 'carts', user.id);
        const snapshot = await getDoc(userCartRef);
        
        let mergedItems = cartRef.current;
        if (snapshot.exists()) {
          const remoteItems = (snapshot.data().items as CartItem[]) || [];
          mergedItems = mergeCarts(cartRef.current, remoteItems);
        }

        isFromRemote.current = true;
        setCart(mergedItems);
        
        await setDoc(userCartRef, {
          userId: user.id,
          email: user.email,
          items: mergedItems,
          updatedAt: new Date().toISOString()
        });

        setInitialSyncDone(true);

        unsub = onSnapshot(userCartRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const remoteItems = (data.items as CartItem[]) || [];
            if (!isCartEqual(cartRef.current, remoteItems)) {
              isFromRemote.current = true;
              setCart(remoteItems);
            }
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `carts/${user.id}`);
        });

      } catch (err) {
        console.error('Failed to initialize user cart:', err);
      }
    };

    initUserCart();

    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  // Sync subsequent local alterations to Firestore with a short debounce
  useEffect(() => {
    if (!user || !initialSyncDone) return;
    if (isFromRemote.current) {
      isFromRemote.current = false;
      return;
    }

    const syncChanges = async () => {
      try {
        const userCartRef = doc(db, 'carts', user.id);
        await setDoc(userCartRef, {
          userId: user.id,
          email: user.email,
          items: cart,
          updatedAt: new Date().toISOString()
        });
        console.log('[Cart Flow Sync] Successfully synced local cart updates to database');
      } catch (err) {
        console.error('[Cart Flow Sync Error]', err);
      }
    };

    const timeout = setTimeout(syncChanges, 300);
    return () => clearTimeout(timeout);
  }, [cart, user, initialSyncDone]);



  const addToCart = (product: Product, size: number, quantity = 1) => {
    setCart((prevCart) => {
      // Find matches with same productId AND same ring size
      const existingIndex = prevCart.findIndex(
        (item) => item.productId === product.id && item.size === size
      );

      if (existingIndex > -1) {
        // Increment quantity of the matched item
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        // Add new separate item in the cart!
        // Generates a unique cart item ID
        const cartItemId = `${product.id}-${size}-${Date.now()}`;
        return [
          ...prevCart,
          {
            id: cartItemId,
            productId: product.id,
            name: product.name,
            price: Number(product.price) || 0,
            image: product.image,
            material: product.material,
            description: product.description || '',
            size,
            quantity,
          },
        ];
      }
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      )
    );
  };

  const updateSize = (cartItemId: string, size: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === cartItemId ? { ...item, size } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateSize,
        clearCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
