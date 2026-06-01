import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, Upload, X, Eye, EyeOff } from 'lucide-react'

const empty = {
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  cta_text: 'Order Now',
  is_active: true,
  sort_order: 0,
}

export default function Banners() {
  const [banners, setBanners] = useState<any[]>([])
  const [form, setForm] = useState(empty)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .order('sort_order')
    if (error) alert('Fetch error: ' + error.message)
    setBanners(data || [])
  }

  useEffect(() => { fetchBanners() }, [])

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

  const save = async () => {
    if (!form.title || !form.image_url) {
      alert('Title and image are required!')
      return
    }
    setSaving(true)
    if (editing) {
      const { error } = await supabase.from('ads').update(form).eq('id', editing)
      if (error) { alert('Update failed: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('ads').insert(form)
      if (error) { alert('Save failed: ' + error.message); setSaving(false); return }
    }
    setForm(empty)
    setEditing(null)
    setShowForm(false)
    setSaving(false)
    fetchBanners()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    await supabase.from('ads').delete().eq('id', id)
    fetchBanners()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('ads').update({ is_active: !current }).eq('id', id)
    fetchBanners()
  }

  const edit = (banner: any) => {
    setForm({ ...banner })
    setEditing(banner.id)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Ad Banners</h2>
          <p className="text-gray-400 text-sm">{banners.length} banners • shown on homepage</p>
        </div>
        <button
          onClick={() => { setForm(empty); setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'New'} Banner</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="e.g. Summer Special"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Subtitle</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="e.g. 20% off all smoothies"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Banner Image *</label>
              <label className="flex items-center gap-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-pointer hover:border-amber-500">
                <Upload size={14} />
                {uploading ? 'Uploading...' : form.image_url ? 'Change image' : 'Upload image'}
                <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
              </label>
              {form.image_url && (
                <img src={form.image_url} className="mt-2 w-full h-24 rounded-lg object-cover" />
              )}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Link URL (optional)</label>
              <input
                type="text"
                value={form.link_url}
                onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="e.g. /menu"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Button Text</label>
              <input
                type="text"
                value={form.cta_text}
                onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="e.g. Order Now"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              />
              <label className="text-sm text-gray-300">Active (show on homepage)</label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={save}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-4 py-2 rounded-lg text-sm font-medium"
            >
              {saving ? 'Saving...' : editing ? 'Update Banner' : 'Create Banner'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {banners.length === 0 && (
          <div className="col-span-2 text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🖼️</p>
            <p>No banners yet. Add your first banner!</p>
          </div>
        )}
        {banners.map(b => (
          <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {b.image_url && (
              <img src={b.image_url} className="w-full h-32 object-cover" />
            )}
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-white">{b.title}</h4>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  b.is_active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {b.is_active ? 'Active' : 'Hidden'}
                </span>
              </div>
              {b.subtitle && (
                <p className="text-xs text-gray-400 mb-3">{b.subtitle}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => edit(b)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs text-gray-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(b.id, b.is_active)}
                  className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400"
                >
                  {b.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => del(b.id)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
