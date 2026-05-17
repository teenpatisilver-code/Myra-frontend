import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2 } from 'lucide-react'

type DrinkForm = {
  name: string
  description: string
  ingredients: string
  price: string
  category_id: string
  is_available: boolean
  is_featured: boolean
  image_url: string
  calories: string
  protein: string
}

const empty: DrinkForm = {
  name: '',
  description: '',
  ingredients: '',
  price: '',
  category_id: '',
  is_available: true,
  is_featured: false,
  image_url: '',
  calories: '',
  protein: '',
}

export default function Drinks() {
  const [drinks, setDrinks] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [form, setForm] = useState<DrinkForm>(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchData = async () => {
    const [d, c] = await Promise.all([
      supabase.from('drinks').select('*, categories(name)').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])

    if (d.error) alert('Fetch error: ' + d.error.message)

    setDrinks(d.data || [])
    setCategories(c.data || [])
  }

  useEffect(() => {
    fetchData()
  }, [])

  // ✅ UPDATED SAVE FUNCTION
  const save = async () => {
    const name = form.name?.trim()
    const priceRaw = form.price?.toString().trim()
    const price = parseFloat(priceRaw)

    if (!name) {
      alert('Name is required!')
      return
    }

    if (!priceRaw || isNaN(price) || price <= 0) {
      alert('Valid price is required!')
      return
    }

    setSaving(true)

    const payload = {
      name,
      description: form.description?.trim() || null,
      ingredients: form.ingredients?.trim() || null,
      price,
      category_id: form.category_id || null,
      is_available: Boolean(form.is_available),
      is_featured: Boolean(form.is_featured),
      image_url: form.image_url?.trim() || null,
      calories:
        form.calories !== ''
          ? parseInt(form.calories)
          : null,
      protein:
        form.protein !== ''
          ? parseFloat(form.protein)
          : null,
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from('drinks')
          .update(payload)
          .eq('id', editing)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('drinks')
          .insert(payload)

        if (error) throw error
      }

      setForm(empty)
      setEditing(null)
      setShowForm(false)
      await fetchData()
    } catch (error: any) {
      alert((editing ? 'Update' : 'Insert') + ' failed: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const del = async (id: string) => {
    if (!confirm('Delete this drink?')) return

    const { error } = await supabase
      .from('drinks')
      .delete()
      .eq('id', id)

    if (error) alert('Delete failed: ' + error.message)
    else fetchData()
  }

  const edit = (drink: any) => {
    setForm({
      ...drink,
      price: drink.price?.toString() || '',
      calories: drink.calories?.toString() || '',
      protein: drink.protein?.toString() || '',
      category_id: drink.category_id || '',
      ingredients: drink.ingredients || '',
      description: drink.description || '',
    })

    setEditing(drink.id)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Drinks Menu</h2>
          <p className="text-gray-400 text-sm">
            {drinks.length} items on menu
          </p>
        </div>

        <button
          onClick={() => {
            setForm(empty)
            setEditing(null)
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Add Drink
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          {/* FORM CONTENT (unchanged) */}

          <div className="flex gap-3 mt-4">
            <button
              onClick={save}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-4 py-2 rounded-lg text-sm font-medium"
            >
              {saving
                ? 'Saving...'
                : editing
                ? 'Update Drink'
                : 'Create Drink'}
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

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {drinks.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🥤</p>
            <p>No drinks yet. Add your first drink!</p>
          </div>
        )}

        {drinks.map((d) => (
          <div
            key={d.id}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between">
                <h4 className="font-semibold">{d.name}</h4>
                <span className="text-amber-400 font-bold">
                  Rs {d.price}
                </span>
              </div>

              <p className="text-xs text-gray-400">
                {d.categories?.name || 'No category'}
              </p>

              <div className="flex gap-2 mt-3">
                <button onClick={() => edit(d)}>
                  <Pencil size={14} />
                </button>

                <button onClick={() => del(d.id)}>
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