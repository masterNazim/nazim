"use client"

import { createContext, useContext, useReducer, useEffect } from "react"

const CartContext = createContext()

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM":
      const existingItem = state.find((item) => item.id === action.payload.id)
      if (existingItem) {
        return state.map((item) => (item.id === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...state, { ...action.payload, quantity: 1 }]

    case "REMOVE_ITEM":
      return state.filter((item) => item.id !== action.payload)

    case "UPDATE_QUANTITY":
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item,
      )

    case "CLEAR_CART":
      return []

    case "UPDATE_STOCK":
      return state.map((item) => {
        const stockUpdate = action.payload.find((update) => update.id === item.id)
        return stockUpdate ? { ...item, availableStock: stockUpdate.stock } : item
      })

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [cartItems, dispatch] = useReducer(cartReducer, [])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        parsedCart.forEach((item) => {
          dispatch({ type: "ADD_ITEM", payload: item })
        })
      } catch (error) {
        console.error("Error loading cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (product) => {
    dispatch({ type: "ADD_ITEM", payload: product })
  }

  const removeFromCart = (productId) => {
    dispatch({ type: "REMOVE_ITEM", payload: productId })
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      dispatch({ type: "UPDATE_QUANTITY", payload: { id: productId, quantity } })
    }
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  const refreshCartStock = async () => {
    if (cartItems.length === 0) return

    try {
      const productIds = cartItems.map((item) => item.id)
      const response = await fetch("/api/products/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          dispatch({ type: "UPDATE_STOCK", payload: result.data })
        }
      }
    } catch (error) {
      console.error("Error refreshing cart stock:", error)
    }
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemsCount,
        refreshCartStock,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
