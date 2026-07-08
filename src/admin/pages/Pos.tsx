import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Minus, Trash2, Send, Banknote, QrCode, ShoppingBag, Search, CheckCircle, Percent, Tag } from 'lucide-react'

export default function Pos() {
  const [drinks, setDrinks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<any[]>([])
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)

  const fetchData = async () => {
    const [d, c] = await Promise.all([
      supabase.from('drinks').select('*, categories(name)').eq('is_available', true).order('name'),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    setDrinks(d.data || [])
    setCategories(c.data || [])
  }

  useEffect(() => { fetchData() }, [])

  const filtered = drinks.filter(d => {
    const matchCat = selectedCategory ? d.category_id === selectedCategory : true
    const matchSearch = search ? d.name.toLowerCase().includes(search.toLowerCase()) : true
    return matchCat && matchSearch
  })

  const addToCart = (drink: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === drink.id)
      if (existing) return prev.map(i => i.id === drink.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...drink, qty: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0))
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id))
  const clearCart = () => { setCart([]); setTableNumber(''); setCustomerName(''); setDiscountValue('') }

  const subtotal = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0)
  const discountAmt = discountValue
    ? discountType === 'percent'
      ? (subtotal * parseFloat(discountValue)) / 100
      : parseFloat(discountValue)
    : 0
  const total = Math.max(0, subtotal - discountAmt)
  const change = cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0

  const placeOrder = async () => {
    if (cart.length === 0) return
    setPlacing(true)
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        status: 'confirmed',
        total_amount: total,
        order_type: orderType,
        table_number: tableNumber || null,
        payment_method: paymentMethod,
        cash_received: paymentMethod === 'cash' ? parseFloat(cashReceived) || 0 : total,
        change_amount: paymentMethod === 'cash' ? change : 0,
        discount_percent: discountType === 'percent' ? parseFloat(discountValue) || 0 : 0,
        discount_amount: discountAmt,
        is_paid: true,
        source: 'pos',
        notes: customerName ? `Customer: ${customerName}` : null,
      }).select().single()

      if (error || !order) throw error

      const { error: itemsError } = await supabase.from('order_items').insert(
        cart.map(i => ({
          order_id: order.id,
          drink_id: i.id,
          drink_name: i.name,
          quantity: i.qty,
          unit_price: Number(i.price),
          subtotal: Number(i.price) * i.qty,
        }))
      )

      if (itemsError) {
        console.error('order_items insert failed:', itemsError)
        await supabase.from('orders').delete().eq('id', order.id)
        throw itemsError
      }

      setLastOrder({ ...order, items: cart, change, discountAmt })
      setSuccess(true)
      clearCart()
      setCashReceived('')
    } catch (err) {
      console.error('placeOrder failed:', err)
      alert('Failed to place order. Open browser console (F12) and screenshot the red error for me.')
    } finally {
      setPlacing(false)
    }
  }

  if (success && lastOrder) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Order Sent!</h2>
          <p className="text-gray-400 text-sm">Kitchen has been notified</p>
          <div className="bg-gray-800 rounded-xl p-4 text-left space-y-2">
            {lastOrder.items.map((i: any) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-gray-300">{i.name} × {i.qty}</span>
                <span className="text-amber-400">Rs {Math.round(Number(i.price) * i.qty)}</span>
              </div>
            ))}
            {lastOrder.discountAmt > 0 && (
              <div className="flex justify-between text-sm text-green-400 border-t border-gray-700 pt-2">
                <span>Discount</span>
                <span>- Rs {Math.round(lastOrder.discountAmt)}</span>
              </div>
            )}
            <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-amber-400">Rs {Math.round(lastOrder.total_amount)}</span>
            </div>
            {lastOrder.payment_method === 'cash' && lastOrder.change > 0 && (
              <div className="flex justify-between text-green-400 font-bold text-lg">
                <span>Change</span>
                <span>Rs {Math.round(lastOrder.change)}</span>
              </div>
            )}
          </div>
          <button onClick={() => setSuccess(false)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-bold text-lg">
            New Order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* LEFT — Menu */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-800">
        <div className="p-3 space-y-2 border-b border-gray-800 bg-gray-900">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search drinks..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${!selectedCategory ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
              All
            </button>
            {categories.map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${selectedCategory === c.id ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filtered.map(drink => {
              const inCart = cart.find(i => i.id === drink.id)
              return (
                <button key={drink.id} onClick={() => addToCart(drink)}
                  className={`relative rounded-xl p-3 text-left transition-all active:scale-95 border ${inCart ? 'bg-amber-500/15 border-amber-500/50' : 'bg-gray-900 border-gray-800 hover:border-gray-600'}`}>
                  {drink.image_url
                    ? <img src={drink.image_url} alt={drink.name} className="w-full aspect-square object-cover rounded-lg mb-2" />
                    : <div className="w-full aspect-square rounded-lg mb-2 flex items-center justify-center bg-gray-800 text-3xl">🥤</div>
                  }
                  <p className="text-white text-xs font-semibold line-clamp-2">{drink.name}</p>
                  <p className="text-amber-400 text-sm font-bold mt-1">Rs {drink.price}</p>
                  {inCart && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {inCart.qty}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* RIGHT — Order Panel */}
      <div className="w-80 flex flex-col bg-gray-900">

        <div className="p-4 border-b border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShoppingBag size={16} className="text-amber-400" /> Order
            </h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-gray-500 hover:text-red-400 text-xs">Clear</button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['dine_in', 'takeaway'] as const).map(type => (
              <button key={type} onClick={() => setOrderType(type)}
                className={`py-1.5 rounded-lg text-xs font-medium ${orderType === type ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                {type === 'dine_in' ? '🪑 Dine In' : '🛍️ Takeaway'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input value={tableNumber} onChange={e => setTableNumber(e.target.value)}
              placeholder="Table #"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500" />
            <input value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="Name"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500" />
          </div>
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tap drinks to add</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 bg-gray-800 rounded-xl p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{item.name}</p>
                  <p className="text-amber-400 text-xs">Rs {Math.round(Number(item.price) * item.qty)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.id, -1)}
                    className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                    <Minus size={10} className="text-white" />
                  </button>
                  <span className="text-white text-xs w-4 text-center font-bold">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}
                    className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                    <Plus size={10} className="text-white" />
                  </button>
                  <button onClick={() => removeFromCart(item.id)}
                    className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center ml-1">
                    <Trash2 size={10} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-800 space-y-3">

            {/* Discount */}
            <div className="bg-gray-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Tag size={12} /> Discount
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDiscountType('percent')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium flex-1 justify-center ${discountType === 'percent' ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40' : 'bg-gray-700 text-gray-400'}`}>
                  <Percent size={11} /> %
                </button>
                <button onClick={() => setDiscountType('fixed')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium flex-1 justify-center ${discountType === 'fixed' ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40' : 'bg-gray-700 text-gray-400'}`}>
                  Rs Fixed
                </button>
              </div>
              <div className="flex gap-2">
                <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percent' ? '0%' : 'Rs 0'}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-purple-500" />
                {discountType === 'percent' && (
                  <div className="flex gap-1">
                    {[5, 10, 15, 20].map(p => (
                      <button key={p} onClick={() => setDiscountValue(String(p))}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-2 rounded-lg">
                        {p}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {discountAmt > 0 && (
                <p className="text-green-400 text-xs text-center">
                  Saving Rs {Math.round(discountAmt)}
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span>
                <span>Rs {Math.round(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Discount</span>
                  <span>- Rs {Math.round(discountAmt)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Total</span>
                <span>Rs {Math.round(total)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium ${paymentMethod === 'cash' ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                <Banknote size={16} /> Cash
              </button>
              <button onClick={() => setPaymentMethod('qr')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium ${paymentMethod === 'qr' ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                <QrCode size={16} /> QR Pay
              </button>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <input type="number" value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                  placeholder="Cash received"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-center text-lg font-bold focus:outline-none focus:border-green-500" />
                <div className="grid grid-cols-4 gap-1">
                  {[100, 200, 500, 1000].map(amt => (
                    <button key={amt} onClick={() => setCashReceived(String(amt))}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-1.5 rounded-lg">{amt}</button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {[Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500]
                    .filter((v, i, a) => a.indexOf(v) === i && v >= total)
                    .slice(0, 2)
                    .map(amt => (
                      <button key={amt} onClick={() => setCashReceived(String(amt))}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs py-1.5 rounded-lg font-medium">
                        Rs {amt}
                      </button>
                    ))}
                </div>
                {cashReceived && parseFloat(cashReceived) >= total && (
                  <div className="bg-green-500/15 border border-green-500/30 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-400">Change</p>
                    <p className="text-2xl font-bold text-green-400">Rs {Math.round(change)}</p>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'qr' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                <QrCode size={40} className="mx-auto text-blue-400 mb-2" />
                <p className="text-blue-400 text-sm font-medium">Rs {Math.round(total)}</p>
                <p className="text-gray-500 text-xs mt-1">Show QR to customer</p>
              </div>
            )}

            <button onClick={placeOrder}
              disabled={placing || (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total))}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black py-3 rounded-xl font-bold text-base active:scale-95">
              <Send size={18} />
              {placing ? 'Sending...' : 'Send to Kitchen'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
