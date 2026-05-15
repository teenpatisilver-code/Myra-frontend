import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Save, Loader2 } from 'lucide-react'

export default function Settings() {
  const [deliveryPrice, setDeliveryPrice] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'delivery_price').single()
      .then(({ data }) => {
        if (data) setDeliveryPrice(data.value)
        setLoading(false)
      })
  }, [])

  const save = async () => {
    setSaving(true)
    await supabase.from('settings').upsert({ key: 'delivery_price', value: deliveryPrice, updated_at: new Date().toISOString() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage store configuration</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
        <h2 className="text-white font-semibold">Order Settings</h2>

        <div className="space-y-2">
          <label className="text-sm text-gray-400">Delivery Price (Rs)</label>
          {loading ? (
            <div className="h-10 rounded-lg bg-gray-800 animate-pulse" />
          ) : (
            <input
              type="number"
              value={deliveryPrice}
              onChange={(e) => setDeliveryPrice(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="150"
            />
          )}
          <p className="text-xs text-gray-500">This is the fee charged for delivery orders</p>
        </div>

        <button
          onClick={save}
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
