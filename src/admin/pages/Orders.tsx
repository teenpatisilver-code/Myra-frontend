import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { RefreshCw, Bell, X, MapPin, Phone, Package, Trash2 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  preparing: 'bg-orange-500/20 text-orange-400',
  on_the_way: 'bg-purple-500/20 text-purple-400',
  ready: 'bg-green-500/20 text-green-400',
  delivered: 'bg-gray-500/20 text-gray-400',
  completed: 'bg-teal-500/20 text-teal-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

const ALL_STATUSES = ['pending','confirmed','preparing','on_the_way','ready','delivered','completed','cancelled']

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [newOrderAlert, setNewOrderAlert] = useState<any>(null)

  const fetchOrders = async () => {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setOrders(data || [])
  }

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel('new-orders')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'orders',
      }, async (payload) => {
        const { data } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', payload.new.id)
          .single()
        if (data) { setNewOrderAlert(data); fetchOrders() }
        try { new Audio('https://www.soundjay.com/buttons/sounds/button-09a.mp3').play().catch(() => {}) } catch {}
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [filter])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    fetchOrders()
    if (selectedOrder?.id === id) setSelectedOrder((prev: any) => ({ ...prev, status }))
  }

  const deleteOrder = async (id: string) => {
    if (!confirm('Delete this order?')) return
    await supabase.from('order_items').delete().eq('order_id', id)
    await supabase.from('orders').delete().eq('id', id)
    setSelectedOrder(null)
    fetchOrders()
  }

  return (
    <div>
      {/* New Order Alert */}
      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-black rounded-xl p-4 shadow-2xl max-w-sm animate-bounce">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                <Bell size={16} /> 🎉 New Order!
              </div>
              <p className="text-xs font-bold">Rs {newOrderAlert.total_amount?.toFixed(2)}</p>
              <p className="text-xs capitalize">{newOrderAlert.order_type?.replace('_', ' ') || 'Pickup'}</p>
            </div>
            <button onClick={() => setNewOrderAlert(null)}><X size={16} /></button>
          </div>
          <button
            onClick={() => { setSelectedOrder(newOrderAlert); setNewOrderAlert(null) }}
            className="mt-2 w-full bg-black text-white text-xs rounded-lg py-1.5 font-semibold"
          >
            View Order
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Order #{String(selectedOrder.id).slice(0,8)}</h3>
                <p className="text-gray-400 text-xs">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Customer */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Customer</h4>
                <p className="text-sm text-white font-mono">{selectedOrder.user_id?.slice(0,16)}...</p>
                {selectedOrder.phone_number && (
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <Phone size={14} />{selectedOrder.phone_number}
                  </div>
                )}
              </div>

              {/* Delivery Info */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Order Type</h4>
                <p className="text-sm text-white capitalize">{selectedOrder.order_type?.replace(/_/g, ' ') || 'Pickup'}</p>
                {selectedOrder.delivery_address && (
                  <div className="flex items-start gap-2 text-sm text-gray-300">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                    {selectedOrder.delivery_address}
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Items</h4>
                {selectedOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-300"><Package size={12} className="inline mr-1" />{item.drink_name} × {item.quantity}</span>
                    <span className="text-amber-400">Rs {Math.round((item.unit_price || 0) * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-amber-400">Rs {selectedOrder.total_amount?.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <h4 className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Notes</h4>
                  <p className="text-sm text-gray-300">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Update Status */}
              <div className="space-y-2">
                <h4 className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Update Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedOrder.id, s)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all border ${
                        selectedOrder.status === s
                          ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                          : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteOrder(selectedOrder.id)}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl py-2.5 text-sm font-medium hover:bg-red-500/20 transition-all"
              >
                <Trash2 size={14} /> Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-gray-400 text-sm">{orders.length} total orders</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 px-3 py-2 rounded-lg">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', ...ALL_STATUSES].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr className="text-gray-400 text-xs">
              <th className="text-left p-4">Order ID</th>
              <th className="text-left p-4">Phone</th>
              <th className="text-left p-4">Type</th>
              <th className="text-left p-4">Items</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Update</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Delete</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                <td className="p-4 font-bold text-amber-400 text-xs font-mono">{String(order.id).slice(0,8)}...</td>
                <td className="p-4 text-gray-400 text-xs">{order.phone_number || '—'}</td>
                <td className="p-4 text-gray-400 text-xs capitalize">{order.order_type?.replace('_', ' ') || 'pickup'}</td>
                <td className="p-4 text-gray-300 text-xs">{order.order_items?.length || 0} items</td>
                <td className="p-4 text-amber-400 font-medium">Rs {order.total_amount?.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || ''}`}>
                    {order.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4" onClick={e => e.stopPropagation()}>
                  <select
                    value={order.status}
                    onChange={e => updateStatus(order.id, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  >
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </td>
                <td className="p-4 text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="p-4" onClick={e => e.stopPropagation()}>
                  <button onClick={() => deleteOrder(order.id)} className="text-red-400 hover:text-red-300 p-1">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={9} className="p-8 text-center text-gray-500">No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
