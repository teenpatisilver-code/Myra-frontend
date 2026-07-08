import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { RefreshCw, TrendingUp, Trophy } from 'lucide-react'

export default function DrinkTracker() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all')

  const fetchData = async () => {
    setLoading(true)

    let query = supabase
      .from('order_items')
      .select('drink_name, quantity, unit_price, orders(created_at, status)')

    // Filter by period
    const now = new Date()
    if (period === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      query = query.gte('orders.created_at', start)
    } else if (period === 'week') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('orders.created_at', start)
    } else if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      query = query.gte('orders.created_at', start)
    }

    const { data: items } = await query

    // Group by drink name
    const grouped: Record<string, { name: string; count: number; revenue: number }> = {}

    items?.forEach(item => {
      if (!item.drink_name) return
      if (!grouped[item.drink_name]) {
        grouped[item.drink_name] = { name: item.drink_name, count: 0, revenue: 0 }
      }
      grouped[item.drink_name].count += item.quantity
      grouped[item.drink_name].revenue += (item.unit_price || 0) * item.quantity
    })

    // Sort by count descending
    const sorted = Object.values(grouped).sort((a, b) => b.count - a.count)
    setData(sorted)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [period])

  const maxCount = data[0]?.count || 1
  const totalSold = data.reduce((s, d) => s + d.count, 0)
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)

  const medalColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600']
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy size={24} className="text-amber-400" /> Drink Leaderboard
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {totalSold} drinks sold · Rs {totalRevenue.toFixed(0)} revenue
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 px-3 py-2 rounded-lg"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Period filter */}
      <div className="flex gap-2">
        {(['all', 'today', 'week', 'month'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              period === p ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {p === 'all' ? 'All Time' : p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Top 3 podium */}
      {data.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {data.slice(0, 3).map((d, i) => (
            <div
              key={d.name}
              className={`bg-gray-900 border rounded-xl p-4 text-center ${
                i === 0 ? 'border-yellow-500/40' : i === 1 ? 'border-gray-500/40' : 'border-amber-600/40'
              }`}
            >
              <p className="text-3xl mb-1">{medals[i]}</p>
              <p className="text-white font-bold text-sm line-clamp-2">{d.name}</p>
              <p className={`text-2xl font-black mt-1 ${medalColors[i]}`}>{d.count}</p>
              <p className="text-gray-500 text-xs">sold</p>
              <p className="text-amber-400 text-xs mt-1">Rs {d.revenue.toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full leaderboard */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <TrendingUp size={16} className="text-amber-400" />
          <h3 className="font-semibold text-sm">Full Rankings</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No orders yet for this period.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {data.map((d, i) => {
              const barWidth = Math.max(4, (d.count / maxCount) * 100)
              return (
                <div key={d.name} className="p-4 flex items-center gap-4">

                  {/* Rank */}
                  <div className="w-8 text-center">
                    {i < 3
                      ? <span className="text-lg">{medals[i]}</span>
                      : <span className="text-gray-500 text-sm font-bold">#{i + 1}</span>
                    }
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm font-medium truncate">{d.name}</p>
                      <span className="text-gray-400 text-xs ml-2 shrink-0">
                        Rs {d.revenue.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${barWidth}%`,
                          background: i === 0
                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                            : i === 1
                            ? 'linear-gradient(90deg, #6b7280, #9ca3af)'
                            : i === 2
                            ? 'linear-gradient(90deg, #92400e, #b45309)'
                            : 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Count */}
                  <div className="text-right shrink-0">
                    <p className="text-white font-bold text-lg">{d.count}</p>
                    <p className="text-gray-500 text-xs">sold</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
