import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2 } from 'lucide-react'

export default function Categories() {
  const [cats, setCats] = useState<any[]>([])
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')

  const fetch = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCats(data || [])
  }

  useEffect(() => { fetch() }, [])

  const add = async () => {
    if (!name.trim()) return
    await supabase.from('categories').insert({ name, emoji })
    setName(''); setEmoji('')
    fetch()
  }

  const del = async (id: string) => {
    if (!confirm('Delete category? Drinks in it will lose their category.')) return
    await supabase.from('categories').delete().eq('id', id)
    fetch()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Categories</h2>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex gap-3">
          <input
            placeholder="Emoji (optional)"
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          />
          <input
            placeholder="Category name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
          />
          <button
            onClick={add}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map(c => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <span className="font-medium">{c.emoji} {c.name}</span>
            <button onClick={() => del(c.id)} className="text-gray-500 hover:text-red-400">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
