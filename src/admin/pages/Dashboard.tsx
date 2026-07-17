import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  ShoppingBag, Coffee, Users, TrendingUp, TrendingDown,
  Sparkles, RefreshCw, Plus, Trash2, DollarSign, AlertTriangle,
  Briefcase, Monitor, Tag
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  preparing: 'bg-orange-500/20 text-orange-400',
  ready: 'bg-green-500/20 text-green-400',
  delivered: 'bg-gray-500/20 text-gray-400',
  completed: 'bg-teal-500/20 text-teal-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

const EXPENSE_CATEGORIES = [
  'ingredients', 'rent', 'salary', 'utilities',
  'packaging', 'marketing', 'equipment', 'other'
]

function PopularDrinks() {
  const [drinks, setDrinks] = useState<any[]>([])

  useEffect(() => {
    supabase.from('drink_popularity').select('*').limit(10)
      .then(({ data }) => setDrinks(data || []))
  }, [])

  if (drinks.length === 0) return null

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold">🏆 Most Popular Drinks</h3>
        <span className="text-xs text-gray-400">by units sold</span>
      </div>
      <div className="divide-y divide-gray-800">
        {drinks.map((d, i) => (
          <div key={d.menu_item_id} className="flex items-center gap-4 p-4 hover:bg-gray-800/30">
            <span className={`text-lg font-black w-8 text-center ${
              i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-700' : 'text-gray-600'
            }`}>
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{d.drink_name}</p>
              <p className="text-gray-500 text-xs">{d.total_orders} orders</p>
            </div>
            <div className="text-right">
              <p className="text-amber-400 font-bold text-sm">{d.total_sold} sold</p>
              <p className="text-gray-500 text-xs">Rs {Math.round(d.total_revenue || 0)}</p>
            </div>
            <div className="w-20 bg-gray-800 rounded-full h-1.5">
              <div className="bg-amber-500 h-1.5 rounded-full"
                style={{ width: `${drinks[0]?.total_sold ? (d.total_sold / drinks[0].total_sold) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalDrinks: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    todayOrders: 0,
    totalExpenses: 0,
    todayExpenses: 0,
    posOrders: 0,
    deletedOrders: 0,
    totalDiscounts: 0,
  })
  const [investmentStats, setInvestmentStats] = useState({
    totalInvestors: 0,
    totalInvestment: 0,
    totalLoans: 0,
    totalEquity: 0,
    totalEmployees: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'pos'>('overview')

  const [expForm, setExpForm] = useState({
    title: '', amount: '', category: 'ingredients',
    date: new Date().toISOString().split('T')[0], notes: ''
  })
  const [addingExp, setAddingExp] = useState(false)
  const [showExpForm, setShowExpForm] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const fetchAll = async () => {
    const [ordersRes, drinksRes, customersRes, expensesRes, recentRes, investorsRes, deletedRes] = await Promise.all([
      supabase.from('orders').select('id, total_amount, status, created_at, source, discount_amount, is_paid').is('deleted_at', null),
      supabase.from('drinks').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
      supabase.from('orders').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(10),
      supabase.from('investors').select('*'),
      supabase.from('orders').select('id', { count: 'exact' }).not('deleted_at', 'is', null),
    ])

    const orders = ordersRes.data || []
    const completedOrders = orders.filter(o =>
      ['delivered', 'completed'].includes(o.status) ||
      (o.is_paid === true && o.source === 'pos')
    )
    const todayOrders = orders.filter(o => o.created_at?.startsWith(today))
    const todayCompleted = todayOrders.filter(o =>
      ['delivered', 'completed'].includes(o.status) ||
      (o.is_paid === true && o.source === 'pos')
    )
    const posOrders = orders.filter(o => o.source === 'pos')
    const totalDiscounts = orders.reduce((s, o) => s + (o.discount_amount || 0), 0)

    const allExpenses = expensesRes.data || []
    const todayExp = allExpenses.filter(e => e.date === today)

    setStats({
      totalOrders: orders.length,
      totalDrinks: drinksRes.count || 0,
      totalCustomers: customersRes.count || 0,
      totalRevenue: completedOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
      todayRevenue: todayCompleted.reduce((s, o) => s + (o.total_amount || 0), 0),
      todayOrders: todayOrders.length,
      totalExpenses: allExpenses.reduce((s, e) => s + (e.amount || 0), 0),
      todayExpenses: todayExp.reduce((s, e) => s + (e.amount || 0), 0),
      posOrders: posOrders.length,
      deletedOrders: deletedRes.count || 0,
      totalDiscounts,
    })

    const inv = investorsRes.data || []
    setInvestmentStats({
      totalInvestors: inv.filter(i => i.relationship_type === 'Investor').length,
      totalInvestment: inv.reduce((s, i) => s + (i.investment_amount || 0), 0),
      totalLoans: inv.reduce((s, i) => s + (i.loan_amount || 0), 0),
      totalEquity: inv.reduce((s, i) => s + (i.equity_percentage || 0), 0),
      totalEmployees: inv.filter(i => i.relationship_type === 'Employee').length,
    })

    setExpenses(allExpenses)
    setRecentOrders(recentRes.data || [])
  }

  useEffect(() => { fetchAll() }, [])

  const profit = stats.totalRevenue - stats.totalExpenses
  const todayProfit = stats.todayRevenue - stats.todayExpenses

  const addExpense = async () => {
    if (!expForm.title || !expForm.amount) return
    setAddingExp(true)
    await supabase.from('expenses').insert({
      title: expForm.title,
      amount: parseFloat(expForm.amount),
      category: expForm.category,
      date: expForm.date,
      notes: expForm.notes || null,
    })
    setExpForm({ title: '', amount: '', category: 'ingredients', date: today, notes: '' })
    setShowExpForm(false)
    setAddingExp(false)
    fetchAll()
  }

  const deleteExpense = async (id: number) => {
    if (!confirm('Delete this expense?')) return
    await supabase.from('expenses').delete().eq('id', id)
    fetchAll()
  }

  const getAiInsight = async () => {
    setAiLoading(true)
    setAiInsight('')
    try {
      const { askGemini } = await import('../../lib/gemini')
      const text = await askGemini(
        `You are a business analyst for Myra Mocktail Bar, a premium drinks bar in Kathmandu, Nepal.
Business Stats:
- Total Orders: ${stats.totalOrders} (POS: ${stats.posOrders})
- Today's Orders: ${stats.todayOrders}
- Total Revenue: Rs ${stats.totalRevenue.toFixed(2)}
- Today's Revenue: Rs ${stats.todayRevenue.toFixed(2)}
- Total Expenses: Rs ${stats.totalExpenses.toFixed(2)}
- Net Profit: Rs ${profit.toFixed(2)}
- Menu Items: ${stats.totalDrinks}
- Total Customers: ${stats.totalCustomers}
- Total Discounts Given: Rs ${stats.totalDiscounts.toFixed(2)}
- Deleted Orders: ${stats.deletedOrders}
- Total Investment Raised: Rs ${investmentStats.totalInvestment.toFixed(2)}
- Total Loans: Rs ${investmentStats.totalLoans.toFixed(2)}
- Equity Distributed: ${investmentStats.totalEquity.toFixed(1)}%

Give 3-4 sentences of smart business insight and 2 specific actionable recommendations to grow profit. Be specific to a Kathmandu mocktail bar.`
      )
      setAiInsight(text)
    } catch {
      setAiInsight('Failed to generate insight. Please try again.')
    }
    setAiLoading(false)
  }

  const expByCategory = expenses.reduce((acc: any, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-gray-400 text-sm">Myra Mocktail Bar — business overview</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-800 px-3 py-2 rounded-lg">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-1">
        {(['overview', 'expenses', 'pos'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg capitalize transition-all ${
              activeTab === tab ? 'text-amber-400 border-b-2 border-amber-400' : 'text-gray-400 hover:text-white'
            }`}>
            {tab === 'pos' ? '🖥 POS Stats' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Today snapshot */}
          <div className="bg-gray-900 rounded-xl border border-amber-500/30 p-4">
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-3">📅 Today</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400">Orders</p>
                <p className="text-2xl font-bold text-white">{stats.todayOrders}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Revenue</p>
                <p className="text-2xl font-bold text-green-400">Rs {stats.todayRevenue.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Profit</p>
                <p className={`text-2xl font-bold ${todayProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Rs {todayProfit.toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Menu Items', value: stats.totalDrinks, icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Total Revenue', value: `Rs ${stats.totalRevenue.toFixed(0)}`, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">{label}</span>
                  <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon size={16} className={color} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          {/* Profit / Loss */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl p-5 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-400" />
                <span className="text-xs text-gray-400">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-green-400">Rs {stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-5 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={16} className="text-red-400" />
                <span className="text-xs text-gray-400">Total Expenses</span>
              </div>
              <p className="text-2xl font-bold text-red-400">Rs {stats.totalExpenses.toFixed(2)}</p>
            </div>
            <div className={`bg-gray-900 rounded-xl p-5 border ${profit >= 0 ? 'border-amber-500/30' : 'border-red-500/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                {profit >= 0
                  ? <DollarSign size={16} className="text-amber-400" />
                  : <AlertTriangle size={16} className="text-red-400" />
                }
                <span className="text-xs text-gray-400">Net {profit >= 0 ? 'Profit' : 'Loss'}</span>
              </div>
              <p className={`text-2xl font-bold ${profit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                Rs {Math.abs(profit).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Investment Summary */}
          <div className="bg-gray-900 rounded-xl border border-purple-500/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={16} className="text-purple-400" />
              <h3 className="font-semibold text-purple-400 text-sm uppercase tracking-wider">Investment Overview</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Investors', value: investmentStats.totalInvestors, color: 'text-amber-400' },
                { label: 'Total Investment', value: `Rs ${investmentStats.totalInvestment.toLocaleString()}`, color: 'text-green-400' },
                { label: 'Total Loans', value: `Rs ${investmentStats.totalLoans.toLocaleString()}`, color: 'text-red-400' },
                { label: 'Equity Given', value: `${investmentStats.totalEquity.toFixed(1)}%`, color: 'text-purple-400' },
                { label: 'Employees', value: investmentStats.totalEmployees, color: 'text-blue-400' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-gray-900 rounded-xl border border-amber-500/30 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-400" />
                <h3 className="font-semibold text-amber-400">AI Business Insight</h3>
              </div>
              <button onClick={getAiInsight} disabled={aiLoading}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-4 py-2 rounded-lg text-sm font-medium">
                <Sparkles size={14} />
                {aiLoading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
            {aiInsight
              ? <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{aiInsight}</p>
              : <p className="text-gray-500 text-sm">Click "Analyze" to get AI-powered business insights.</p>
            }
          </div>

          {/* Recent Orders */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h3 className="font-semibold">Recent Orders</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-400 text-xs">
                  <th className="text-left p-4">ID</th>
                  <th className="text-left p-4">Source</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Total</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-4 font-bold text-amber-400 text-xs font-mono">{String(order.id).slice(0, 8)}...</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.source === 'pos' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-700 text-gray-400'}`}>
                        {order.source === 'pos' ? '🖥️ POS' : '📱 App'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs capitalize">{order.order_type?.replace('_', ' ') || 'pickup'}</td>
                    <td className="p-4 text-amber-400 font-medium">Rs {order.total_amount?.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || ''}`}>
                        {order.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Most Popular Drinks */}
          <PopularDrinks />
        </>
      )}

      {activeTab === 'expenses' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Today's Expenses</p>
              <p className="text-xl font-bold text-red-400">Rs {stats.todayExpenses.toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Total Expenses</p>
              <p className="text-xl font-bold text-red-400">Rs {stats.totalExpenses.toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Net Profit</p>
              <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                Rs {profit.toFixed(2)}
              </p>
            </div>
          </div>

          {Object.keys(expByCategory).length > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <h3 className="font-semibold mb-3 text-sm">Expenses by Category</h3>
              <div className="space-y-2">
                {Object.entries(expByCategory).sort(([, a], [, b]) => (b as number) - (a as number)).map(([cat, amt]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 capitalize w-24 shrink-0">{cat}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div className="bg-amber-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, ((amt as number) / stats.totalExpenses) * 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-300 w-24 text-right">Rs {(amt as number).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3 className="font-semibold">All Expenses</h3>
            <button onClick={() => setShowExpForm(!showExpForm)}
              className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-400">
              <Plus size={14} /> Add Expense
            </button>
          </div>

          {showExpForm && (
            <div className="bg-gray-900 rounded-xl border border-gray-700 p-5 space-y-4">
              <h4 className="font-semibold text-sm">New Expense</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Title *</label>
                  <input value={expForm.title} onChange={e => setExpForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Milk supply"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Amount (Rs) *</label>
                  <input type="number" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Category</label>
                  <select value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Date</label>
                  <input type="date" value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
                <input value={expForm.notes} onChange={e => setExpForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional details..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={addExpense} disabled={addingExp || !expForm.title || !expForm.amount}
                  className="flex-1 bg-amber-500 text-black py-2 rounded-lg text-sm font-medium hover:bg-amber-400 disabled:opacity-50">
                  {addingExp ? 'Adding...' : 'Add Expense'}
                </button>
                <button onClick={() => setShowExpForm(false)}
                  className="px-4 bg-gray-800 text-gray-400 py-2 rounded-lg text-sm hover:text-white">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-400 text-xs">
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Notes</th>
                  <th className="text-left p-4">Delete</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-4 text-white font-medium">{exp.title}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-300 capitalize">{exp.category}</span>
                    </td>
                    <td className="p-4 text-red-400 font-medium">Rs {exp.amount?.toFixed(2)}</td>
                    <td className="p-4 text-gray-400 text-xs">{exp.date}</td>
                    <td className="p-4 text-gray-500 text-xs">{exp.notes || '—'}</td>
                    <td className="p-4">
                      <button onClick={() => deleteExpense(exp.id)} className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">No expenses recorded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'pos' && (
        <>
          {/* POS Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl p-5 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Monitor size={16} className="text-cyan-400" />
                <span className="text-xs text-gray-400">POS Orders</span>
              </div>
              <p className="text-2xl font-bold text-cyan-400">{stats.posOrders}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalOrders > 0 ? Math.round((stats.posOrders / stats.totalOrders) * 100) : 0}% of total orders
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl p-5 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 size={16} className="text-red-400" />
                <span className="text-xs text-gray-400">Deleted Orders</span>
              </div>
              <p className="text-2xl font-bold text-red-400">{stats.deletedOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Cancelled / wrong orders</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-5 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Tag size={16} className="text-purple-400" />
                <span className="text-xs text-gray-400">Total Discounts Given</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">Rs {stats.totalDiscounts.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalRevenue > 0 ? ((stats.totalDiscounts / (stats.totalRevenue + stats.totalDiscounts)) * 100).toFixed(1) : 0}% of gross sales
              </p>
            </div>
          </div>

          {/* App vs POS breakdown */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h3 className="font-semibold mb-4 text-sm">Order Source Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">🖥️ POS</span>
                <div className="flex-1 bg-gray-800 rounded-full h-3">
                  <div className="bg-cyan-500 h-3 rounded-full transition-all"
                    style={{ width: `${stats.totalOrders > 0 ? (stats.posOrders / stats.totalOrders) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-cyan-400 w-16 text-right font-medium">{stats.posOrders} orders</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">📱 App</span>
                <div className="flex-1 bg-gray-800 rounded-full h-3">
                  <div className="bg-amber-500 h-3 rounded-full transition-all"
                    style={{ width: `${stats.totalOrders > 0 ? ((stats.totalOrders - stats.posOrders) / stats.totalOrders) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-amber-400 w-16 text-right font-medium">{stats.totalOrders - stats.posOrders} orders</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 shrink-0">❌ Deleted</span>
                <div className="flex-1 bg-gray-800 rounded-full h-3">
                  <div className="bg-red-500 h-3 rounded-full transition-all"
                    style={{ width: `${(stats.totalOrders + stats.deletedOrders) > 0 ? (stats.deletedOrders / (stats.totalOrders + stats.deletedOrders)) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-red-400 w-16 text-right font-medium">{stats.deletedOrders} orders</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
