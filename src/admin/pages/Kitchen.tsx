import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Clock, ChefHat, Bell, Trash2, Eye, EyeOff, Download, Calendar } from 'lucide-react'

const STATUS_FLOW = ['confirmed', 'preparing', 'ready', 'completed']

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '🆕 New' },
  preparing: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '👨‍🍳 Preparing' },
  ready: { bg: 'bg-green-500/20', text: 'text-green-400', label: '✅ Ready' },
  completed: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '✓ Done' },
}

export default function Kitchen() {
  const [orders, setOrders] = useState<any[]>([])
  const [deletedOrders, setDeletedOrders] = useState<any[]>([])
  const [allOrders, setAllOrders] = useState<any[]>([])
  const [showDeleted, setShowDeleted] = useState(false)
  const [newAlert, setNewAlert] = useState(false)
  const [deleteModal, setDeleteModal] = useState<any>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const prevCountRef = useRef(0)

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(id, quantity, drink_name, drink_id, unit_price)')
      .in('status', ['confirmed', 'preparing', 'ready'])
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    const resolved = (data || []).map(order => ({
      ...order,
      order_items: (order.order_items || []).map((item: any) => ({
        ...item,
        display_name: item.drink_name || `Item #${item.id}`,
      }))
    }))

    setOrders(resolved)

    if (resolved.length > prevCountRef.current) {
      setNewAlert(true)
      try { new Audio('https://www.soundjay.com/buttons/sounds/button-09a.mp3').play().catch(() => {}) } catch {}
      setTimeout(() => setNewAlert(false), 3000)
    }
    prevCountRef.current = resolved.length
  }

  const fetchDeletedOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(id, quantity, drink_name, drink_id, unit_price)')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .limit(50)

    const resolved = (data || []).map(order => ({
      ...order,
      order_items: (order.order_items || []).map((item: any) => ({
        ...item,
        display_name: item.drink_name || `Item #${item.id}`,
      }))
    }))

    setDeletedOrders(resolved)
  }

  const fetchAllOrdersByDate = async (date: string) => {
    const start = `${date}T00:00:00`
    const end = `${date}T23:59:59`
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(id, quantity, drink_name, unit_price, subtotal)')
      .gte('created_at', start)
      .lte('created_at', end)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    setAllOrders(data || [])
  }

  const downloadCSV = () => {
    const data = allOrders.length > 0 ? allOrders : orders
    if (data.length === 0) { alert('No orders to download'); return }

    const rows: string[] = []
    rows.push('Order ID,Table,Type,Payment,Status,Source,Items,Total,Time')

    data.forEach(order => {
      const items = order.order_items?.map((i: any) =>
        `${i.quantity}x ${i.drink_name || 'Unknown'}`
      ).join(' | ') || ''
      const time = new Date(order.created_at).toLocaleTimeString()
      rows.push([
        String(order.id).slice(0, 8),
        order.table_number || 'Takeaway',
        (order.order_type || '').replace('_', ' '),
        order.payment_method || 'cash',
        order.status || '',
        order.source || 'app',
        `"${items}"`,
        (order.total_amount || 0).toFixed(2),
        time
      ].join(','))
    })

    // Summary
    const totalRevenue = data
      .filter(o => ['completed', 'delivered', 'confirmed'].includes(o.status))
      .reduce((s, o) => s + (o.total_amount || 0), 0)
    const totalDiscounts = data.reduce((s, o) => s + (o.discount_amount || 0), 0)

    rows.push('')
    rows.push(`Date,${dateFilter}`)
    rows.push(`Total Orders,${data.length}`)
    rows.push(`Total Revenue,Rs ${totalRevenue.toFixed(2)}`)
    rows.push(`Total Discounts,Rs ${totalDiscounts.toFixed(2)}`)
    rows.push(`Net Revenue,Rs ${(totalRevenue - totalDiscounts).toFixed(2)}`)

    const csv = rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `myra-orders-${dateFilter}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchOrders()
    fetchAllOrdersByDate(dateFilter)
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, fetchOrders)
      .subscribe()
    const interval = setInterval(fetchOrders, 10000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [])

  useEffect(() => {
    if (showDeleted) fetchDeletedOrders()
  }, [showDeleted])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    fetchOrders()
  }

  const deleteOrder = async () => {
    if (!deleteModal) return
    await supabase.from('orders').update({
      deleted_at: new Date().toISOString(),
      deleted_reason: deleteReason || 'Deleted by staff',
      status: 'cancelled'
    }).eq('id', deleteModal.id)
    setDeleteModal(null)
    setDeleteReason('')
    fetchOrders()
  }

  const nextStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current)
    return idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null
  }

  const getMinutes = (createdAt: string) =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)

  return (
    <div className="min-h-screen bg-gray-950 p-4">

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-lg text-white">Delete Order?</h3>
            <div className="bg-gray-800 rounded-xl p-3 space-y-1">
              {deleteModal.order_items?.map((item: any) => (
                <p key={item.id} className="text-gray-300 text-sm">
                  {item.quantity}× {item.display_name}
                </p>
              ))}
              <p className="text-amber-400 font-bold text-sm pt-2 border-t border-gray-700 mt-2">
                Total: Rs {Math.round(deleteModal.total_amount)}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Reason (optional)</label>
              <input value={deleteReason} onChange={e => setDeleteReason(e.target.value)}
                placeholder="e.g. Wrong order, customer cancelled"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={deleteOrder}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white py-2 rounded-xl font-medium text-sm">
                Delete Order
              </button>
              <button onClick={() => { setDeleteModal(null); setDeleteReason('') }}
                className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-xl text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Alert */}
      {newAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 animate-bounce shadow-xl">
          <Bell size={20} /> 🎉 New Order!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ChefHat size={28} className="text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Kitchen Display</h1>
            <p className="text-gray-400 text-sm">{orders.length} active · {allOrders.length} today</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Date picker */}
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => {
                setDateFilter(e.target.value)
                fetchAllOrdersByDate(e.target.value)
              }}
              className="bg-transparent text-white text-sm focus:outline-none"
            />
          </div>

          {/* Download CSV */}
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm hover:bg-green-500/30 transition-all">
            <Download size={14} /> Download CSV
          </button>

          {/* Deleted Orders */}
          <button onClick={() => setShowDeleted(!showDeleted)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${showDeleted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-gray-800 text-gray-400'}`}>
            {showDeleted ? <EyeOff size={14} /> : <Eye size={14} />}
            {showDeleted ? 'Hide Deleted' : 'Deleted'}
          </button>

          <button onClick={fetchOrders}
            className="bg-gray-800 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm">
            Refresh
          </button>
        </div>
      </div>

      {/* Today's Summary Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400">Today Orders</p>
            <p className="text-xl font-bold text-white">{allOrders.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Today Revenue</p>
            <p className="text-xl font-bold text-green-400">
              Rs {allOrders.filter(o => ['completed', 'confirmed', 'delivered'].includes(o.status))
                .reduce((s, o) => s + (o.total_amount || 0), 0).toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">POS Orders</p>
            <p className="text-xl font-bold text-cyan-400">
              {allOrders.filter(o => o.source === 'pos').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Discounts Given</p>
            <p className="text-xl font-bold text-purple-400">
              Rs {allOrders.reduce((s, o) => s + (o.discount_amount || 0), 0).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Deleted Orders Section */}
      {showDeleted && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
            <Trash2 size={18} /> Deleted Orders ({deletedOrders.length})
          </h2>
          {deletedOrders.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No deleted orders</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {deletedOrders.map(order => (
                <div key={order.id} className="bg-gray-900 border border-red-500/20 rounded-xl p-4 opacity-75 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium text-sm">
                        {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="text-red-400 text-xs font-bold">❌ Deleted</span>
                  </div>
                  {order.deleted_reason && (
                    <p className="text-gray-500 text-xs bg-gray-800 rounded px-2 py-1">
                      Reason: {order.deleted_reason}
                    </p>
                  )}
                  <div className="space-y-1">
                    {order.order_items?.map((item: any) => (
                      <p key={item.id} className="text-gray-400 text-xs">
                        {item.quantity}× {item.drink_name || 'Unknown item'}
                      </p>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs border-t border-gray-800 pt-2">
                    <span className="text-gray-500">
                      {order.deleted_at ? new Date(order.deleted_at).toLocaleString() : ''}
                    </span>
                    <span className="text-red-400 font-bold">Rs {Math.round(order.total_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-gray-800 mb-6" />
        </div>
      )}

      {/* Active Orders */}
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
                  isUrgent ? 'border-red-500/50 bg-red-500/5' :
                  order.status === 'confirmed' ? 'border-yellow-500/40 bg-yellow-500/5' :
                  'border-gray-800 bg-gray-900'
                }`}>

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-bold text-xl">
                      {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
                    </p>
                    {order.notes && (
                      <p className="text-gray-400 text-xs mt-0.5">{order.notes}</p>
                    )}
                    <p className="text-xs mt-1 flex items-center gap-1"
                      style={{ color: isUrgent ? '#f87171' : '#6b7280' }}>
                      <Clock size={10} /> {mins}m ago
                      {isUrgent && ' ⚠️ Urgent!'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <button onClick={() => setDeleteModal(order)}
                      className="text-gray-600 hover:text-red-400 p-1 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 border-t border-gray-800 pt-3">
                  {order.order_items?.length > 0 ? (
                    order.order_items.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 bg-gray-800/60 rounded-lg px-3 py-2.5">
                        <span className="bg-amber-500 text-black text-sm font-black rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
                          {item.quantity}
                        </span>
                        <span className="text-white text-sm font-semibold leading-tight">
                          {item.display_name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic text-center py-2">No items</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full capitalize">
                    {order.order_type?.replace('_', ' ') || 'dine in'}
                  </span>
                  <span className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full capitalize">
                    {order.payment_method || 'cash'}
                  </span>
                  {order.source === 'pos' && (
                    <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">POS</span>
                  )}
                  <span className="text-amber-400 font-bold ml-auto text-sm">
                    Rs {Math.round(order.total_amount)}
                  </span>
                </div>

                {/* Action Button */}
                {next && (
                  <button onClick={() => updateStatus(order.id, next)}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                      next === 'preparing' ? 'bg-orange-500 hover:bg-orange-400 text-white' :
                      next === 'ready' ? 'bg-green-500 hover:bg-green-400 text-white' :
                      'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}>
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
