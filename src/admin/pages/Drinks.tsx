import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const empty = { name: '', description: '', price: '', category_id: '', available: true, image_url: '' }

export default function Drinks() {
  const [drinks, setDrinks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const fetch = async () => {
    const [d, c] = await Promise.all([
      supabase.from('drinks').select('*, categories(name)').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setDrinks(d.data || [])
    setCategories(c.data || [])
  }

  useEffect(() => { fetch() }, [])

  const save = async () => {
    const payload = { ...form, price: parseFloat(form.price as string) }
    if (editing) {
      await supabase.from('drinks').update(payload).eq('id', editing)
    } else {
      await supabase.from('drinks').insert(payload)
    }
    setForm(empty)
    setEditing(null)
    setShowForm(false)
    fetch()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this drink?')) return
    await supabase.from('drinks').delete().eq('id', id)
    fetch()
  }

  const edit = (drink: any) => {
    setForm({ ...drink, price: drink.price.toString() })
    setEditing(drink.id)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Drinks</h2>
        <button
          onClick={() => { setForm(empty); setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Add Drink
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">{editing ? 'Edit' : 'New'} Drink</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ['Name', 'name', 'text'],
              ['Price', 'price', 'number'],
              ['Image URL', 'image_url', 'text'],
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                <input
                  type={type}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="avail"
                checked={form.available}
                onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
              />
              <label htmlFor="avail" className="text-sm text-gray-300">Available</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium">
              {editing ? 'Update' : 'Create'}
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr className="text-gray-400">
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Available</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drinks.map(d => (
              <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-4 font-medium">{d.name}</td>
                <td className="p-4 text-gray-400">{d.categories?.name || '—'}</td>
                <td className="p-4 text-amber-400">${d.price}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${d.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {d.available ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => edit(d)} className="text-gray-400 hover:text-white"><Pencil size={15} /></button>
                    <button onClick={() => del(d.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
