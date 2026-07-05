import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle, Clock, ChefHat, Bell } from 'lucide-react'

const STATUS_FLOW = ['confirmed', 'preparing', 'ready', 'completed']

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '🆕 New' },
  preparing: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '👨‍🍳 Preparing' },
  ready: { bg: 'bg-green-500/20', text: 'text-green-400', label: '✅ Ready' },
  completed: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '✓ Done' },
}

export default function Kitchen() {
  const [orders, setOrders] = useState<any[]>([])
  const [newAlert, setNewAlert] = useState(false)
  const prevCountRef = useRef(0)

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .in('status', ['confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true })
    setOrders(data || [])

    // Alert on new orders
    if (data && data.length > prevCountRef.current) {
      setNewAlert(true)
      try { new Audio('https://www.soundjay.com/buttons/sounds/button-09a.mp3').play().catch(() => {}) } catch {}
      setTimeout(() => setNewAlert(false), 3000)
    }
    prevCountRef.current = data?.length || 0
  }

  useEffect(() => {
    fetchOrders()

    // Real-time subscription
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders'
      }, () => fetchOrders())
      .subscribe()

    // Poll every 10 seconds as backup
    const interval = setInterval(fetchOrders, 10000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    fetchOrders()
  }

  const nextStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current)
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  }

  const getMinutes = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime()
    return Math.floor(diff / 60000)
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">

      {/* Alert */}
      {newAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 animate-bounce shadow-xl">
          <Bell size={20} /> New Order!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ChefHat size={28} className="text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Kitchen Display</h1>
            <p className="text-gray-400 text-sm">{orders.length} active orders</p>
          </div>
        </div>
        <button onClick={fetchOrders}
          className="bg-gray-800 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm">
          Refresh
        </button>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="text-center py-24 text-gray-600">
          <ChefHat size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg">No active orders</p>
          <p className="text-sm mt-1">Orders will appear here in real-time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => {
            const mins = getMinutes(order.created_at)
            const next = nextStatus(order.status)
            const style = STATUS_STYLES[order.status]
            const isUrgent = mins >= 10 && order.status !== 'ready'

            return (
              <div key={order.id}
                className={`rounded-2xl border p-4 space-y-3 transition-all ${
                  isUrgent
                    ? 'border-red-500/50 bg-red-500/5'
                    : order.status === 'confirmed'
                    ? 'border-yellow-500/40 bg-yellow-500/5'
                    : 'border-gray-800 bg-gray-900'
                }`}>

                {/* Order Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-bold text-lg">
                      {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
                    </p>
                    {order.notes && (
                      <p className="text-gray-400 text-xs">{order.notes}</p>
                    )}
                    <p className="text-xs mt-0.5 flex items-center gap-1"
                      style={{ color: isUrgent ? '#f87171' : '#6b7280' }}>
                      <Clock size={10} /> {mins}m ago
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1.5 border-t border-gray-800 pt-3">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="bg-amber-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {item.quantity}
                      </span>
                      <span className="text-white text-sm font-medium">{item.drink_name}</span>
                    </div>
                  ))}
                </div>

                {/* Order Type + Payment */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full capitalize">
                    {order.order_type?.replace('_', ' ')}
                  </span>
                  <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full capitalize">
                    {order.payment_method || 'cash'}
                  </span>
                  <span className="text-amber-400 font-bold ml-auto">
                    Rs {Math.round(order.total_amount)}
                  </span>
                </div>

                {/* Action Button */}
                {next && (
                  <button
                    onClick={() => updateStatus(order.id, next)}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                      next === 'preparing' ? 'bg-orange-500 hover:bg-orange-400 text-white' :
                      next === 'ready' ? 'bg-green-500 hover:bg-green-400 text-white' :
                      'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {next === 'preparing' && '👨‍🍳 Start Preparing'}
                    {next === 'ready' && '✅ Mark Ready'}
                    {next === 'completed' && '✓ Complete Order'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
