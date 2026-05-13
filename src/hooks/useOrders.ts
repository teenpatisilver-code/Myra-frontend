import { supabase } from '../lib/supabase'

export async function placeOrder(cart: any[], userId: string, notes = '') {
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0)

  const { data: order, error } = await supabase
    .from('orders')
    .insert({ user_id: userId, total, notes, status: 'pending' })
    .select()
    .single()

  if (error || !order) throw error

  const items = cart.map(i => ({
    order_id: order.id,
    drink_id: i.id,
    quantity: i.qty,
    price: i.price
  }))

  await supabase.from('order_items').insert(items)
  return order
}
