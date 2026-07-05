import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Minus, Trash2, Send, X, Banknote, QrCode, ShoppingBag, Search, CheckCircle } from 'lucide-react'

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
  const [showPayment, setShowPayment] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
      return updated
    })
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id))
  const clearCart = () => { setCart([]); setTableNumber(''); setCustomerName(''); setShowPayment(false) }

  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0)
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
        is_paid: true,
        source: 'pos',
        notes: customerName ? `Customer: ${customerName}` : null,
      }).select().single()

      if (error || !order) throw error

      await supabase.from('order_items').insert(
        cart.map(i => ({
          order_id: order.id,
          drink_id: i.id,
          drink_name: i.name,
          quantity: i.qty,
          unit_price: Number(i.price),
          subtotal: Number(i.price) * i.qty,
        }))
      )

      setLastOrder({ ...order, items: cart, change })
      setSuccess(true)
      setCart([])
      setTableNumber('')
      setCustomerName('')
      setCashReceived('')
      setShowPayment(false)

    } catch (err) {
      alert('Failed to place order. Please try again.')
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

          <button
            onClick={() => setSuccess(false)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-bold text-lg"
          >
            New Order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden gap-0">

      {/* LEFT — Menu */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-800">

        {/* Search + Categories */}
        <div className="p-3 space-y-2 border-b border-gray-800 bg-gray-900">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search drinks..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!selectedCategory ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(selectedCategory === c.id ? null : c.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${selectedCategory === c.id ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Drinks Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filtered.map(drink => {
              const inCart = cart.find(i => i.id === drink.id)
              return (
                <button
                  key={drink.id}
                  onClick={() => addToCart(drink)}
                  className={`relative rounded-xl p-3 text-left transition-all active:scale-95 border ${
                    inCart
                      ? 'bg-amber-500/15 border-amber-500/50'
                      : 'bg-gray-900 border-gray-800 hover:border-gray-600'
                  }`}
                >
                  {drink.image_url ? (
                    <img src={drink.image_url} alt={drink.name}
                      className="w-full aspect-square object-cover rounded-lg mb-2" />
                  ) : (
                    <div className="w-full aspect-square rounded-lg mb-2 flex items-center justify-center bg-gray-800 text-3xl">🥤</div>
                  )}
                  <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{drink.name}</p>
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
      <div className="w-80 flex flex-col bg-gray-900 border-l border-gray-800">

        {/* Order Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShoppingBag size={16} className="text-amber-400" />
              Current Order
            </h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-gray-500 hover:text-red-400 text-xs">Clear</button>
            )}
          </div>

          {/* Order Type */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(['dine_in', 'takeaway'] as const).map(type => (
              <button key={type} onClick={() => setOrderType(type)}
                className={`py-1.5 rounded-lg text-xs font-medium transition-all ${orderType === type ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
                {type === 'dine_in' ? '🪑 Dine In' : '🛍️ Takeaway'}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              placeholder="Table #"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Name"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Cart Items */}
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
                    className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600">
                    <Minus size={10} className="text-white" />
                  </button>
                  <span className="text-white text-xs w-4 text-center font-bold">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}
                    className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600">
                    <Plus size={10} className="text-white" />
                  </button>
                  <button onClick={() => removeFromCart(item.id)}
                    className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/40 ml-1">
                    <Trash2 size={10} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total + Payment */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{cart.reduce((s, i) => s + i.qty, 0)} items</span>
              <span className="text-2xl font-bold text-white">Rs {Math.round(total)}</span>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${paymentMethod === 'cash' ? 'bg-green-500/20 border border-green-500/50 text-green-400' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                <Banknote size={16} /> Cash
              </button>
              <button onClick={() => setPaymentMethod('qr')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${paymentMethod === 'qr' ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                <QrCode size={16} /> QR Pay
              </button>
            </div>

            {/* Cash Entry */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <input
                  type="number"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  placeholder="Cash received"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-center text-lg font-bold focus:outline-none focus:border-green-500"
                />
                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-1">
                  {[100, 200, 500, 1000].map(amt => (
                    <button key={amt} onClick={() => setCashReceived(String(amt))}
                      className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-1.5 rounded-lg">
                      {amt}
                    </button>
                  ))}
                  {/* Exact change buttons */}
                  {[Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500].filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 2).map(amt => (
                    <button key={amt} onClick={() => setCashReceived(String(amt))}
                      className="col-span-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs py-1.5 rounded-lg font-medium">
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
                <p className="text-gray-500 text-xs mt-1">Show QR code to customer</p>
              </div>
            )}

            {/* Send to Kitchen */}
            <button
              onClick={placeOrder}
              disabled={placing || (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < total))}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black py-3 rounded-xl font-bold text-base transition-all active:scale-95"
            >
              <Send size={18} />
              {placing ? 'Sending...' : 'Send to Kitchen'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
