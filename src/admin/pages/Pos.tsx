import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Plus, Minus, Trash2, Send, Banknote, QrCode, ShoppingBag,
  Search, CheckCircle, Percent, Tag, Users, Split,
  Clock, X, ChevronRight, Receipt
} from 'lucide-react'

type OrderType = 'dine_in' | 'takeaway'
type PaymentMethod = 'cash' | 'qr'
type Screen = 'menu' | 'payment' | 'split' | 'tabs'

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  image_url?: string
  assigned_to?: string
}

interface Tab {
  id: number
  table_number: string
  customer_name: string
  status: string
  created_at: string
  orders?: any[]
}

export default function Pos() {
  const [drinks, setDrinks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('')
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)
  const [screen, setScreen] = useState<Screen>('menu')
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTab, setActiveTab] = useState<Tab | null>(null)
  const [splitPeople, setSplitPeople] = useState<string[]>(['Person 1', 'Person 2'])
  const [splitMode, setSplitMode] = useState<'equal' | 'byDrink'>('equal')
  const [selectedPerson, setSelectedPerson] = useState<string>('')
  const [pendingBills, setPendingBills] = useState<{person: string, items: CartItem[], paid: boolean, method?: string}[]>([])
  const [showTabModal, setShowTabModal] = useState(false)
  const [newTabName, setNewTabName] = useState('')
  const [newTabTable, setNewTabTable] = useState('')

  const fetchData = async () => {
    const [d, c] = await Promise.all([
      supabase.from('drinks').select('*, categories(name)').eq('is_available', true).order('name'),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    setDrinks(d.data || [])
    setCategories(c.data || [])
  }

  const fetchTabs = async () => {
    const { data } = await supabase.from('tabs').select('*').eq('status', 'open').order('created_at', { ascending: false })
    setTabs(data || [])
  }

  useEffect(() => { fetchData(); fetchTabs() }, [])

  const filtered = drinks.filter(d => {
    const matchCat = selectedCategory ? d.category_id === selectedCategory : true
    const matchSearch = search ? d.name.toLowerCase().includes(search.toLowerCase()) : true
    return matchCat && matchSearch
  })

  const addToCart = (drink: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === drink.id)
      if (existing) return prev.map(i => i.id === drink.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: drink.id, name: drink.name, price: Number(drink.price), qty: 1, image_url: drink.image_url }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0))
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id))

  const clearCart = () => {
    setCart([])
    setTableNumber('')
    setCustomerName('')
    setDiscountValue('')
    setCashReceived('')
    setActiveTab(null)
    setSplitPeople(['Person 1', 'Person 2'])
    setPendingBills([])
    setScreen('menu')
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discountAmt = discountValue
    ? discountType === 'percent' ? (subtotal * parseFloat(discountValue)) / 100 : parseFloat(discountValue)
    : 0
  const total = Math.max(0, subtotal - discountAmt)
  const change = cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0

  // Create open tab (pay later)
  const createTab = async () => {
    if (!newTabTable) return
    const { data } = await supabase.from('tabs').insert({
      table_number: newTabTable,
      customer_name: newTabName || null,
      status: 'open'
    }).select().single()
    if (data) {
      setActiveTab(data)
      setTableNumber(newTabTable)
      setCustomerName(newTabName)
      setShowTabModal(false)
      setNewTabName('')
      setNewTabTable('')
      fetchTabs()
    }
  }

  // Load existing tab
  const loadTab = async (tab: Tab) => {
    setActiveTab(tab)
    setTableNumber(tab.table_number)
    setCustomerName(tab.customer_name)
    setScreen('menu')
    // Load existing items from tab's orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('tab_id', tab.id)
      .eq('status', 'confirmed')
    if (orders && orders.length > 0) {
      const allItems: CartItem[] = []
      orders.forEach(order => {
        order.order_items?.forEach((item: any) => {
          allItems.push({
            id: item.drink_id,
            name: item.drink_name,
            price: item.unit_price,
            qty: item.quantity,
            assigned_to: item.assigned_to,
          })
        })
      })
      setCart(allItems)
    }
  }

  // Close tab
  const closeTab = async (tabId: number) => {
    await supabase.from('tabs').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', tabId)
    fetchTabs()
    if (activeTab?.id === tabId) clearCart()
  }

  // Setup split bill
  const setupSplit = () => {
    if (cart.length === 0) return
    setScreen('split')
    // Initialize pending bills
    const bills = splitPeople.map(person => ({
      person,
      items: [] as CartItem[],
      paid: false,
    }))
    setPendingBills(bills)
    if (splitMode === 'equal') {
      // Split equally
      const perPerson = total / splitPeople.length
      setPendingBills(bills.map(b => ({
        ...b,
        items: cart.map(i => ({ ...i, qty: i.qty / splitPeople.length }))
      })))
    }
  }

  const assignItemToPerson = (item: CartItem, person: string) => {
    setCart(prev => prev.map(i => i.id === item.id ? { ...i, assigned_to: person } : i))
  }

  const getPersonTotal = (person: string) => {
    if (splitMode === 'equal') return total / splitPeople.length
    return cart
      .filter(i => i.assigned_to === person)
      .reduce((s, i) => s + i.price * i.qty, 0)
  }

  const markPersonPaid = (person: string, method: string) => {
    setPendingBills(prev => prev.map(b => b.person === person ? { ...b, paid: true, method } : b))
  }

  const allPaid = pendingBills.length > 0 && pendingBills.every(b => b.paid)

  // Place order
  const placeOrder = async (payLater = false) => {
    if (cart.length === 0) return
    setPlacing(true)
    try {
      const { data: order, error } = await supabase.from('orders').insert({
        status: payLater ? 'confirmed' : 'confirmed',
        total_amount: total,
        order_type: orderType,
        table_number: tableNumber || null,
        payment_method: payLater ? 'pending' : paymentMethod,
        cash_received: !payLater && paymentMethod === 'cash' ? parseFloat(cashReceived) || 0 : 0,
        change_amount: !payLater && paymentMethod === 'cash' ? change : 0,
        discount_percent: discountType === 'percent' ? parseFloat(discountValue) || 0 : 0,
        discount_amount: discountAmt,
        is_paid: !payLater,
        source: 'pos',
        tab_id: activeTab?.id || null,
        notes: customerName ? `Customer: ${customerName}` : null,
      }).select().single()

      if (error || !order) throw error

      await supabase.from('order_items').insert(
        cart.map(i => ({
          order_id: order.id,
          drink_id: i.id,
          drink_name: i.name,
          quantity: i.qty,
          unit_price: i.price,
          subtotal: i.price * i.qty,
          assigned_to: i.assigned_to || null,
          is_paid: !payLater,
        }))
      )

      if (payLater && activeTab) {
        // Keep tab open, just clear cart for next order
        setCart([])
        setDiscountValue('')
        setCashReceived('')
        setScreen('menu')
        setSuccess(false)
        alert(`✅ Order added to Tab - Table ${tableNumber}. Drinks sent to kitchen!`)
        return
      }

      setLastOrder({ ...order, items: cart, change, discountAmt })
      setSuccess(true)
      clearCart()
    } catch {
      alert('Failed to place order.')
    } finally {
      setPlacing(false)
    }
  }

  if (success && lastOrder) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Order Complete!</h2>
          <div className="bg-gray-800 rounded-xl p-4 text-left space-y-2">
            {lastOrder.items.map((i: any) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-gray-300">{i.name} × {i.qty}</span>
                <span className="text-amber-400">Rs {Math.round(i.price * i.qty)}</span>
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

  // SPLIT BILL SCREEN
  if (screen === 'split') {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setScreen('menu')} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Split size={20} className="text-amber-400" /> Split Bill
            </h2>
          </div>

          {/* Split Mode */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSplitMode('equal')}
              className={`py-2 rounded-xl text-sm font-medium ${splitMode === 'equal' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
              ÷ Split Equally
            </button>
            <button onClick={() => setSplitMode('byDrink')}
              className={`py-2 rounded-xl text-sm font-medium ${splitMode === 'byDrink' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'}`}>
              🥤 By Drink
            </button>
          </div>

          {/* People */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">People</h3>
              <button onClick={() => setSplitPeople(prev => [...prev, `Person ${prev.length + 1}`])}
                className="text-xs bg-gray-800 text-amber-400 px-3 py-1 rounded-lg hover:bg-gray-700">
                + Add Person
              </button>
            </div>
            {splitPeople.map((person, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input value={person}
                  onChange={e => setSplitPeople(prev => prev.map((p, i) => i === idx ? e.target.value : p))}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500" />
                <span className="text-amber-400 font-bold text-sm min-w-20 text-right">
                  Rs {Math.round(getPersonTotal(person))}
                </span>
                {splitPeople.length > 2 && (
                  <button onClick={() => setSplitPeople(prev => prev.filter((_, i) => i !== idx))}
                    className="text-gray-600 hover:text-red-400">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* By Drink Assignment */}
          {splitMode === 'byDrink' && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2">
              <h3 className="font-semibold text-white text-sm mb-3">Assign Drinks to People</h3>
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">
                  <div className="flex-1">
                    <p className="text-white text-xs font-medium">{item.name}</p>
                    <p className="text-amber-400 text-xs">Rs {Math.round(item.price * item.qty)} × {item.qty}</p>
                  </div>
                  <select value={item.assigned_to || ''}
                    onChange={e => assignItemToPerson(item, e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                    <option value="">Unassigned</option>
                    {splitPeople.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Per person payment */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white text-sm">Collect Payment</h3>
            {splitPeople.map(person => {
              const bill = pendingBills.find(b => b.person === person)
              const personTotal = getPersonTotal(person)
              return (
                <div key={person} className={`bg-gray-900 border rounded-xl p-4 space-y-3 ${bill?.paid ? 'border-green-500/30' : 'border-gray-800'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{person}</span>
                    <span className="text-amber-400 font-bold">Rs {Math.round(personTotal)}</span>
                  </div>
                  {bill?.paid ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle size={16} /> Paid via {bill.method}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => markPersonPaid(person, 'Cash')}
                        className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30">
                        <Banknote size={14} /> Cash
                      </button>
                      <button onClick={() => markPersonPaid(person, 'QR')}
                        className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30">
                        <QrCode size={14} /> QR Pay
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {allPaid && (
            <button onClick={() => { placeOrder(false); setScreen('menu') }}
              className="w-full bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-bold">
              ✅ All Paid — Complete Order
            </button>
          )}
        </div>
      </div>
    )
  }

  // TABS SCREEN
  if (screen === 'tabs') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setScreen('menu')} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Receipt size={20} className="text-amber-400" /> Open Tabs
            </h2>
          </div>
          <button onClick={() => setShowTabModal(true)}
            className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-xl text-sm font-bold">
            <Plus size={16} /> New Tab
          </button>
        </div>

        {showTabModal && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
              <h3 className="font-bold text-lg text-white">Open New Tab</h3>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Table Number *</label>
                <input value={newTabTable} onChange={e => setNewTabTable(e.target.value)}
                  placeholder="e.g. Table 5"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Customer Name (optional)</label>
                <input value={newTabName} onChange={e => setNewTabName(e.target.value)}
                  placeholder="e.g. Bibek's Group"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={createTab}
                  className="flex-1 bg-amber-500 text-black py-2 rounded-xl font-bold text-sm">
                  Open Tab
                </button>
                <button onClick={() => setShowTabModal(false)}
                  className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-xl text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {tabs.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Receipt size={40} className="mx-auto mb-3 opacity-30" />
            <p>No open tabs</p>
            <p className="text-sm mt-1">Create a tab for customers who pay later</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tabs.map(tab => {
              const mins = Math.floor((Date.now() - new Date(tab.created_at).getTime()) / 60000)
              return (
                <div key={tab.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-bold text-lg">{tab.table_number}</p>
                      {tab.customer_name && <p className="text-gray-400 text-xs">{tab.customer_name}</p>}
                      <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                        <Clock size={10} /> Opened {mins}m ago
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">
                      🔓 Open Tab
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadTab(tab)}
                      className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-black py-2 rounded-xl text-sm font-bold">
                      <ShoppingBag size={14} /> Add Orders
                    </button>
                    <button onClick={() => { loadTab(tab); setScreen('menu') }}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 py-2 rounded-xl text-sm font-medium hover:bg-green-500/30">
                      <Receipt size={14} /> Bill & Pay
                    </button>
                    <button onClick={() => closeTab(tab.id)}
                      className="px-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // MAIN POS SCREEN
  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

      {/* LEFT — Menu */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-800">
        <div className="p-3 space-y-2 border-b border-gray-800 bg-gray-900">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search drinks..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
            <button onClick={() => { setScreen('tabs'); fetchTabs() }}
              className="relative flex items-center gap-1.5 bg-gray-800 border border-gray-700 text-gray-300 px-3 py-2 rounded-lg text-xs hover:border-amber-500 hover:text-amber-400">
              <Receipt size={14} /> Tabs
              {tabs.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {tabs.length}
                </span>
              )}
            </button>
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

        {/* Header */}
        <div className="p-4 border-b border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ShoppingBag size={16} className="text-amber-400" />
              {activeTab ? `Tab: ${activeTab.table_number}` : 'Order'}
            </h3>
            <div className="flex gap-2">
              {activeTab && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">🔓 Tab Open</span>
              )}
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-gray-500 hover:text-red-400 text-xs">Clear</button>
              )}
            </div>
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
                  <p className="text-amber-400 text-xs">Rs {Math.round(item.price * item.qty)}</p>
                  {item.assigned_to && (
                    <p className="text-purple-400 text-xs">→ {item.assigned_to}</p>
                  )}
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
              <div className="flex gap-1">
                <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percent' ? '0%' : 'Rs 0'}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-purple-500" />
                {discountType === 'percent' && [5, 10, 15, 20].map(p => (
                  <button key={p} onClick={() => setDiscountValue(String(p))}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-2 rounded-lg">{p}%</button>
                ))}
              </div>
              {discountAmt > 0 && <p className="text-green-400 text-xs text-center">Saving Rs {Math.round(discountAmt)}</p>}
            </div>

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Subtotal</span><span>Rs {Math.round(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Discount</span><span>- Rs {Math.round(discountAmt)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Total</span><span>Rs {Math.round(total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {/* Pay Later / Tab */}
              <button onClick={() => {
                if (activeTab) {
                  placeOrder(true)
                } else {
                  setShowTabModal(true)
                  setScreen('tabs')
                }
              }}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30">
                <Clock size={14} /> Pay Later
              </button>

              {/* Split Bill */}
              <button onClick={setupSplit}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30">
                <Split size={14} /> Split Bill
              </button>
            </div>

            {/* Payment Method */}
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
                    .filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 2)
                    .map(amt => (
                      <button key={amt} onClick={() => setCashReceived(String(amt))}
                        className="bg-amber-500/20 text-amber-400 text-xs py-1.5 rounded-lg font-medium">
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

            <button onClick={() => placeOrder(false)}
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
