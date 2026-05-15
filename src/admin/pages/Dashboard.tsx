import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ShoppingBag, Coffee, Users, TrendingUp, Sparkles, RefreshCw } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  ready: 'bg-green-500/20 text-green-400',
  delivered: 'bg-gray-500/20 text-gray-400',
}

export default function Dashboard() {
  const [stats, setStats] = useState({ orders: 0, drinks: 0, customers: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const fetchStats = async () => {
    const [orders, drinks, customers] = await Promise.all([
      supabase.from('orders').select('id, total_amount, status, created_at', { count: 'exact' }),
      supabase.from('menu_items').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }),
    ])

    // ✅ Revenue only counts delivered orders
    const revenue = (orders.data || [])
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + (o.total_amount || 0), 0)

    setStats({
      orders: orders.count || 0,
      drinks: drinks.count || 0,
      customers: customers.count || 0,
      revenue
    })

    const { data: recent } = await supabase
      .from('orders')
      .select('*, profiles(email)')
      .order('created_at', { ascending: false })
      .limit(5)

    setRecentOrders(recent || [])
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const getAiInsight = async () => {
    setAiLoading(true)
    setAiInsight('')

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a business analyst for Myra Drinks, a premium drinks app in Kathmandu.
Stats: Orders: ${stats.orders}, Revenue: Rs ${stats.revenue.toFixed(2)}, Drinks: ${stats.drinks}, Customers: ${stats.customers}
Give 3-4 sentences of smart business insight and 2 specific actionable recommendations to grow revenue.`
          }]
        })
      })

      const data = await response.json()

      setAiInsight(
        data.content?.[0]?.text || 'Unable to generate insight.'
      )
    } catch {
      setAiInsight('Failed to generate insight. Please try again.')
    }

    setAiLoading(false)
  }

  const cards = [
    {
      label: 'Total Orders',
      value: stats.orders,
      icon: ShoppingBag,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Drinks on Menu',
      value: stats.drinks,
      icon: Coffee,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Customers',
      value: stats.customers,
      icon: Users,
      color: 'text-green-400',
      bg: 'bg-green-500/10'
    },
    {
      label: 'Total Revenue',
      value: `Rs ${stats.revenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">
            Your business at a glance
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 px-3 py-2 rounded-lg"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-gray-900 rounded-xl p-5 border border-gray-800"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">
                {label}
              </span>

              <div
                className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}
              >
                <Icon size={16} className={color} />
              </div>
            </div>

            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl border border-amber-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h3 className="font-semibold text-amber-400">
              AI Business Insight
            </h3>
          </div>

          <button
            onClick={getAiInsight}
            disabled={aiLoading}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Sparkles size={14} />
            {aiLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {aiInsight ? (
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {aiInsight}
          </p>
        ) : (
          <p className="text-gray-500 text-sm">
            Click "Analyze" to get AI-powered insights.
          </p>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h3 className="font-semibold">Recent Orders</h3>
        </div>

        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr className="text-gray-400 text-xs">

              {/* ✅ Order Number Column */}
              <th className="text-left p-4">#</th>

              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Date</th>
            </tr>
          </thead>

          <tbody>
            {recentOrders.map(order => (
              <tr
                key={order.id}
                className="border-b border-gray-800/50 hover:bg-gray-800/30"
              >

                {/* ✅ Order Number */}
                <td className="p-4 font-bold text-amber-400 text-xs">
                  #{recentOrders.length - recentOrders.indexOf(order)}
                </td>

                <td className="p-4 text-gray-300">
                  {order.profiles?.email || 'Guest'}
                </td>

                <td className="p-4 text-amber-400 font-medium">
                  Rs {order.total_amount?.toFixed(2)}
                </td>

                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || ''}`}
                  >
                    {order.status}
                  </span>
                </td>

                <td className="p-4 text-gray-400 text-xs">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}

            {recentOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}