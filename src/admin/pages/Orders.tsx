import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { RefreshCw } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  ready: 'bg-green-500/20 text-green-400',
  delivered: 'bg-gray-500/20 text-gray-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    setLoading(true)
    let query = supabase.from('orders').select('*, profiles(email)').order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchOrders() }, [filter])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    fetchOrders()
  }

  const filters = ['all', 'pending', 'confirmed', 'ready', 'delivered', 'cancelled']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Orders</h2>
          <p className="text-gray-400 text-sm mt-1">{orders.length} orders</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 px-3 py-2 rounded-lg">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === f ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr className="text-gray-400 text-xs">
              <th className="text-left p-4">ID</th>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Update</th>
              <th className="text-left p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-4 font-mono text-xs text-gray-500">{order.id.slice(0, 8)}</td>
                <td className="p-4 text-gray-300">{order.profiles?.email || 'Guest'}</td>
                <td className="p-4 text-amber-400 font-medium">${order.total?.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || ''}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4">
                  <select value={order.status} onChange={e => updateStatus(order.id, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white">
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="ready">Ready</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="p-4 text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
