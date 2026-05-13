import { useState } from 'react'

export function useCart() {
  const [cart, setCart] = useState<any[]>([])

  const addToCart = (drink: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === drink.id)
      if (existing) {
        return prev.map(i => i.id === drink.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...drink, qty: 1 }]
    })
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0)

  return { cart, addToCart, removeFromCart, total, itemCount }
}
