import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'

const UNITS = ['g', 'kg', 'ml', 'liter', 'piece']
const CATEGORIES = ['fruit', 'vegetable', 'protein', 'dairy', 'syrup', 'tea', 'supplement', 'spice', 'other']

const empty = {
  name: '', category: 'other', purchase_cost: '', purchase_quantity: '',
  unit: 'g', supplier: '', current_stock: '', low_stock_threshold: '100'
}

export default function Ingredients() {
  const [ingredients, setIngredients] = useState<any[]>([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [debugMsg, setDebugMsg] = useState('')

  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name')
    // ✅ debug — shows on screen instead of console
    setDebugMsg(`Count: ${data?.length ?? 0} | Error: ${error ? error.message : 'none'}`)
    setIngredients(data || [])
  }

  useEffect(() => { fetchIngredients() }, [])

  const costPerUnit = (ing: any) => {
    const cost = Number(ing.purchase_cost)
    const qty = Number(ing.purchase_quantity)
    if (!qty) return 0
    return cost / qty
  }

  const save = async () => {
    if (!form.name || !form.purchase_cost || !form.purchase_quantity) {
      alert('Name, cost and quantity are required!')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      category: form.category,
      purchase_cost: parseFloat(form.purchase_cost),
      purchase_quantity: parseFloat(form.purchase_quantity),
      unit: form.unit,
      supplier: form.supplier || null,
      current_stock: parseFloat(form.current_stock) || 0,
      low_stock_threshold: parseFloat(form.low_stock_threshold) || 100,
    }
    if (editing) {
      await supabase.from('ingredients').update(payload).eq('id', editing)
    } else {
      await supabase.from('ingredients').insert(payload)
    }
    setForm(empty)
    setEditing(null)
    setShowForm(false)
    setSaving(false)
    fetchIngredients()
  }

  const del = async (id: number) => {
    if (!confirm('Delete this ingredient?')) return
    await supabase.from('ingredients').delete().eq('id', id)
    fetchIngredients()
  }

  const edit = (ing: any) => {
    setForm({
      name: ing.name,
      category: ing.category,
      purchase_cost: ing.purchase_cost?.toString(),
      purchase_quantity: ing.purchase_quantity?.toString(),
      unit: ing.unit,
      supplier: ing.supplier || '',
      current_stock: ing.current_stock?.toString(),
      low_stock_threshold: ing.low_stock_threshold?.toString()
    })
    setEditing(ing.id)
    setShowForm(true)
  }

  const filtered = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )
  const lowStock = ingredients.filter(i =>
    Number(i.current_stock) <= Number(i.low_stock_threshold)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Ingredients</h2>
          <p className="text-gray-400 text-sm">
            {ingredients.length} ingredients · {lowStock.length} low stock
          </p>
        </div>
        <button
          onClick={() => { setForm(empty); setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Add Ingredient
        </button>
      </div>

      {/* ✅ Debug message — shows on screen */}
      {debugMsg && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4 text-xs text-blue-400">
          🔍 Debug: {debugMsg}
        </div>
      )}

      {/* Low stock alerts */}
      {lowStock.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-2">
            <AlertTriangle size={16} /> Low Stock Alert
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(i => (
              <span key={i.id} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">
                {i.name}: {i.current_stock}{i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search ingredients..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white mb-4 focus:outline-none focus:border-amber-500"
      />

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'New'} Ingredient</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Mango Puree"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Purchase Cost (Rs) *</label>
              <input
                type="number"
                value={form.purchase_cost}
                onChange={e => setForm(f => ({ ...f, purchase_cost: e.target.value }))}
                placeholder="e.g. 500"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Purchase Quantity *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.purchase_quantity}
                  onChange={e => setForm(f => ({ ...f, purchase_quantity: e.target.value }))}
                  placeholder="e.g. 1000"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <select
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Current Stock</label>
              <input
                type="number"
                value={form.current_stock}
                onChange={e => setForm(f => ({ ...f, current_stock: e.target.value }))}
                placeholder="e.g. 500"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Low Stock Threshold</label>
              <input
                type="number"
                value={form.low_stock_threshold}
                onChange={e => setForm(f => ({ ...f, low_stock_threshold: e.target.value }))}
                placeholder="e.g. 100"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Supplier (optional)</label>
              <input
                value={form.supplier}
                onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                placeholder="e.g. Local Market"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {form.purchase_cost && form.purchase_quantity && (
            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-400">
                Cost per {form.unit}:{' '}
                <strong>
                  Rs {(parseFloat(form.purchase_cost) / parseFloat(form.purchase_quantity)).toFixed(3)}
                </strong>
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={save}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-4 py-2 rounded-lg text-sm font-medium"
            >
              {saving ? 'Saving...' : editing ? 'Update' : 'Add Ingredient'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr className="text-gray-400 text-xs">
              <th className="text-left p-4">Ingredient</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Purchase</th>
              <th className="text-left p-4">Cost/Unit</th>
              <th className="text-left p-4">Stock</th>
              <th className="text-left p-4">Supplier</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(ing => {
              const cpu = costPerUnit(ing)
              const isLow = Number(ing.current_stock) <= Number(ing.low_stock_threshold)
              return (
                <tr key={ing.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="p-4 font-medium text-white">{ing.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-gray-800 rounded-full text-xs text-gray-300 capitalize">
                      {ing.category}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300 text-xs">
                    Rs {ing.purchase_cost} / {ing.purchase_quantity}{ing.unit}
                  </td>
                  <td className="p-4 text-amber-400 font-medium text-xs">
                    Rs {cpu.toFixed(3)}/{ing.unit}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-medium ${isLow ? 'text-red-400' : 'text-green-400'}`}>
                      {isLow && '⚠️ '}{ing.current_stock}{ing.unit}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-xs">{ing.supplier || '—'}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => edit(ing)} className="text-gray-400 hover:text-white p-1">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => del(ing.id)} className="text-gray-400 hover:text-red-400 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No ingredients yet. Add your first ingredient!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
