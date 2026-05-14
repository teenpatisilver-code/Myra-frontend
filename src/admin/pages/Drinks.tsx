import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, Sparkles, Upload, X } from 'lucide-react'

const empty = { name: '', description: '', price: '', category_id: '', is_available: true, image_url: '', is_featured: false, calories: '', protein: '' }

export default function Drinks() {
  const [drinks, setDrinks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchData = async () => {
    const [d, c] = await Promise.all([
      supabase.from('drinks').select('*, categories(name)').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setDrinks(d.data || [])
    setCategories(c.data || [])
  }

  useEffect(() => { fetchData() }, [])

  const save = async () => {
    if (!form.name || !form.price) return
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price as string),
      category_id: form.category_id ? parseInt(form.category_id) : null,
      is_available: form.is_available,
      is_featured: form.is_featured,
      image_url: form.image_url,
      calories: form.calories ? parseInt(form.calories) : null,
      protein: form.protein ? parseFloat(form.protein) : null,
    }
    if (editing) {
      await supabase.from('drinks').update(payload).eq('id', editing)
    } else {
      await supabase.from('drinks').insert(payload)
    }
    setForm(empty); setEditing(null); setShowForm(false)
    fetchData()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this drink?')) return
    await supabase.from('drinks').delete().eq('id', id)
    fetchData()
  }

  const edit = (drink: any) => {
    setForm({ ...drink, price: drink.price.toString(), calories: drink.calories?.toString() || '', protein: drink.protein?.toString() || '', category_id: drink.category_id?.toString() || '' })
    setEditing(drink.id)
    setShowForm(true)
  }

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `drinks/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('images').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      setForm(f => ({ ...f, image_url: data.publicUrl }))
    } else {
      alert('Upload failed. Make sure "images" storage bucket exists and is public in Supabase.')
    }
    setUploading(false)
  }

  const aiGenerate = async (type: 'description' | 'price') => {
    if (!form.name) return alert('Enter drink name first!')
    setAiLoading(true)
    try {
      const prompt = type === 'description'
        ? `Write a short enticing 2-sentence menu description for a premium drink called "${form.name}" sold in Kathmandu Nepal. Sound luxurious. No quotes.`
        : `Suggest a fair price in Nepali Rupees for a premium drink called "${form.name}" in Kathmandu. Existing prices: ${drinks.slice(0, 5).map(d => `${d.name}: Rs${d.price}`).join(', ')}. Reply with ONLY a number like 350, nothing else.`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text?.trim() || ''
      if (type === 'description') {
        setForm(f => ({ ...f, description: text }))
      } else {
        if (!isNaN(parseFloat(text))) setForm(f => ({ ...f, price: text }))
      }
    } catch {
      alert('AI failed. Check your API key.')
    }
    setAiLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Drinks Menu</h2>
          <p className="text-gray-400 text-sm">{drinks.length} items on menu</p>
        </div>
        <button onClick={() => { setForm(empty); setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Add Drink
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'New'} Drink</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. Mango Sunrise" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Price (Rs) *</label>
              <div className="flex gap-2">
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="0" />
                <button onClick={() => aiGenerate('price')} disabled={aiLoading || !form.name}
                  className="flex items-center gap-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-2 rounded-lg text-xs disabled:opacity-50">
                  <Sparkles size={12} /> AI
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Photo</label>
              <label className="flex items-center gap-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-pointer hover:border-amber-500 transition-all">
                <Upload size={14} />
                {uploading ? 'Uploading...' : form.image_url ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
              </label>
              {form.image_url && <img src={form.image_url} className="mt-2 w-16 h-16 rounded-lg object-cover" />}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Calories</label>
              <input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. 250" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Protein (g)</label>
              <input type="number" value={form.protein} onChange={e => setForm(f => ({ ...f, protein: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. 20" />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-400">Description</label>
                <button onClick={() => aiGenerate('description')} disabled={aiLoading || !form.name}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50">
                  <Sparkles size={11} /> {aiLoading ? 'Generating...' : 'AI Generate'}
                </button>
              </div>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Describe this drink..." />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} />
                Available
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                Featured
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium">
              {editing ? 'Update' : 'Create'} Drink
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm text-gray-300">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {drinks.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🥤</p>
            <p>No drinks yet. Add your first drink!</p>
          </div>
        )}
        {drinks.map(d => (
          <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all">
            {d.image_url
              ? <img src={d.image_url} className="w-full h-36 object-cover" />
              : <div className="w-full h-36 bg-gray-800 flex items-center justify-center text-4xl">🥤</div>}
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-white">{d.name}</h4>
                <span className="text-amber-400 font-bold">Rs {d.price}</span>
              </div>
              <p className="text-xs text-gray-400 mb-1">{d.categories?.name || 'No category'}</p>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{d.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${d.is_available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {d.is_available ? 'Available' : 'Unavailable'}
                  </span>
                  {d.is_featured && <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400">Featured</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => edit(d)} className="text-gray-400 hover:text-white p-1"><Pencil size={14} /></button>
                  <button onClick={() => del(d.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
