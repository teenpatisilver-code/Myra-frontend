import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Upload, X, Eye, EyeOff, GripVertical } from 'lucide-react'

const empty = { title: '', subtitle: '', image_url: '', link_url: '', is_active: true, sort_order: 0 }

export default function Banners() {
  const [banners, setBanners] = useState<any[]>([])
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchBanners = async () => {
    const { data } = await supabase.from('banners').select('*').order('sort_order')
    setBanners(data || [])
  }

  useEffect(() => { fetchBanners() }, [])

  const save = async () => {
    if (!form.title) return alert('Title is required!')
    setSaving(true)
    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      image_url: form.image_url || null,
      link_url: form.link_url || null,
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
    }
    if (editing) {
      await supabase.from('banners').update(payload).eq('id', editing)
    } else {
      await supabase.from('banners').insert(payload)
    }
    setForm(empty)
    setEditing(null)
    setShowForm(false)
    setSaving(false)
    fetchBanners()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    await supabase.from('banners').delete().eq('id', id)
    fetchBanners()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('banners').update({ is_active: !current }).eq('id', id)
    fetchBanners()
  }

  const edit = (b: any) => {
    setForm({ ...b, sort_order: b.sort_order?.toString() || '0' })
    setEditing(b.id)
    setShowForm(true)
  }

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `banners/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('images').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      setForm(f => ({ ...f, image_url: data.publicUrl }))
    } else {
      alert('Upload failed: ' + error.message)
    }
    setUploading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Banners</h2>
          <p className="text-gray-400 text-sm">{banners.length} banners · controls homepage slideshow</p>
        </div>
        <button
          onClick={() => { setForm(empty); setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'New'} Banner</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Summer Special" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Subtitle</label>
              <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                placeholder="e.g. 20% off all cold drinks" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Link URL (optional)</label>
              <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                placeholder="e.g. /menu?categoryId=1" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Banner Image</label>
              <label className="flex items-center gap-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-pointer hover:border-amber-500">
                <Upload size={14} />
                {uploading ? 'Uploading...' : form.image_url ? 'Change image' : 'Upload image'}
                <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
              </label>
              {form.image_url && (
                <img src={form.image_url} className="mt-2 w-full h-32 rounded-lg object-cover" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <label htmlFor="active" className="text-sm text-gray-300 cursor-pointer">Active (show on homepage)</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-4 py-2 rounded-lg text-sm font-medium">
              {saving ? 'Saving...' : editing ? 'Update' : 'Create Banner'}
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Banners Grid */}
      <div className="space-y-3">
        {banners.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🖼️</p>
            <p>No banners yet. Add your first banner!</p>
          </div>
        )}
        {banners.map(b => (
          <div key={b.id} className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${b.is_active ? 'border-gray-700' : 'border-gray-800 opacity-60'}`}>
            <div className="flex items-center gap-4 p-4">
              <GripVertical size={16} className="text-gray-600 shrink-0" />
              {b.image_url
                ? <img src={b.image_url} className="w-20 h-14 rounded-lg object-cover shrink-0" />
                : <div className="w-20 h-14 rounded-lg bg-gray-800 flex items-center justify-center text-2xl shrink-0">🖼️</div>
              }
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white truncate">{b.title}</h4>
                {b.subtitle && <p className="text-xs text-gray-400 truncate">{b.subtitle}</p>}
                {b.link_url && <p className="text-xs text-blue-400 truncate">{b.link_url}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${b.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                    {b.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <span className="text-xs text-gray-600">Order: {b.sort_order}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(b.id, b.is_active)}
                  className="text-gray-400 hover:text-white p-1" title={b.is_active ? 'Hide' : 'Show'}>
                  {b.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => edit(b)} className="text-gray-400 hover:text-white p-1">✏️</button>
                <button onClick={() => del(b.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
