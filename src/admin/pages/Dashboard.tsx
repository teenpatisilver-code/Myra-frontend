import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ShoppingBag, Coffee, Users, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    orders: 0, drinks: 0, customers: 0, revenue: 0
  })

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('id, total', { count: 'exact' }),
      supabase.from('drinks').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }),
    ]).then(([orders, drinks, customers]) => {
      const revenue = (orders.data || []).reduce((s, o) => s + (o.total || 0), 0)
      setStats({
        orders: orders.count || 0,
        drinks: drinks.count || 0,
        customers: customers.count || 0,
        revenue,
      })
    })
  }, [])

  const cards = [
    { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-blue-400' },
    { label: 'Drinks on Menu', value: stats.drinks, icon: Coffee, color: 'text-amber-400' },
    { label: 'Customers', value: stats.customers, icon: Users, color: 'text-green-400' },
    { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-400' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{label}</span>
              <Icon size={20} className={color} />
            </div>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
