import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

export default function Categories() {
  const [cats, setCats] = useState<any[]>([])
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')

  const fetch = async () => {
    const { data } = await supabase.from('categories').select('*, drinks(count)').order('name')
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

  const startEdit = (c: any) => {
    setEditingId(c.id); setEditName(c.name); setEditEmoji(c.emoji || '')
  }

  const saveEdit = async () => {
    await supabase.from('categories').update({ name: editName, emoji: editEmoji }).eq('id', editingId)
    setEditingId(null)
    fetch()
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Categories</h2>
        <p className="text-gray-400 text-sm mt-1">{cats.length} categories</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h3 className="font-semibold mb-4 text-sm text-gray-400 uppercase tracking-wide">Add New Category</h3>
        <div className="flex gap-3">
          <input placeholder="😊" value={emoji} onChange={e => setEmoji(e.target.value)}
            className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white text-center" />
          <input placeholder="Category name" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
          <button onClick={add}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map(c => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            {editingId === c.id ? (
              <div className="flex gap-2">
                <input value={editEmoji} onChange={e => setEditEmoji(e.target.value)}
                  className="w-12 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-center text-white" />
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white" />
                <button onClick={saveEdit} className="text-green-400 hover:text-green-300"><Check size={15} /></button>
                <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-white"><X size={15} /></button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-white">{c.emoji} {c.name}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{c.drinks?.[0]?.count || 0} drinks</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(c)} className="text-gray-500 hover:text-white"><Pencil size={14} /></button>
                  <button onClick={() => del(c.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
