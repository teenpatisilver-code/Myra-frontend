import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Save, Loader2, Store, Bike, Clock, Instagram } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('key, value')
      .then(({ data }) => {
        const map: Record<string, string> = {}
        data?.forEach(s => { map[s.key] = s.value })
        setSettings(map)
        setLoading(false)
      })
  }, [])

  const set = (key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value }))
    await supabase.from('settings').upsert(rows, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 rounded-xl bg-gray-800 animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your store configuration</p>
      </div>

      {/* Order Settings */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Bike size={16} className="text-amber-400" /> Order Settings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Delivery Fee (Rs)</label>
            <input
              type="number"
              value={settings['delivery_fee'] || '100'}
              onChange={e => set('delivery_fee', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="100"
            />
            <p className="text-xs text-gray-600">Fee charged for delivery orders</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Min Order Amount (Rs)</label>
            <input
              type="number"
              value={settings['min_order'] || '0'}
              onChange={e => set('min_order', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Loyalty Points Per Order</label>
            <input
              type="number"
              value={settings['loyalty_points_per_order'] || '10'}
              onChange={e => set('loyalty_points_per_order', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="10"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Points to Redeem (min)</label>
            <input
              type="number"
              value={settings['min_redeem_points'] || '500'}
              onChange={e => set('min_redeem_points', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="500"
            />
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Store size={16} className="text-amber-400" /> Store Info
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Store Name</label>
            <input
              type="text"
              value={settings['store_name'] || 'Myra Drinks'}
              onChange={e => set('store_name', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Phone Number</label>
            <input
              type="text"
              value={settings['store_phone'] || ''}
              onChange={e => set('store_phone', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="+977 98XXXXXXXX"
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs text-gray-400">Store Address</label>
            <input
              type="text"
              value={settings['store_address'] || ''}
              onChange={e => set('store_address', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="Kathmandu, Nepal"
            />
          </div>
        </div>
      </div>

      {/* Opening Hours */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Clock size={16} className="text-amber-400" /> Opening Hours
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Opening Time</label>
            <input
              type="time"
              value={settings['opening_time'] || '08:00'}
              onChange={e => set('opening_time', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Closing Time</label>
            <input
              type="time"
              value={settings['closing_time'] || '22:00'}
              onChange={e => set('closing_time', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Instagram size={16} className="text-amber-400" /> Social Media
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Instagram URL</label>
            <input
              type="text"
              value={settings['instagram_url'] || ''}
              onChange={e => set('instagram_url', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="https://instagram.com/myradrinks"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-400">Facebook URL</label>
            <input
              type="text"
              value={settings['facebook_url'] || ''}
              onChange={e => set('facebook_url', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
              placeholder="https://facebook.com/myradrinks"
            />
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50 w-full justify-center"
      >
        {saving
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Save className="w-4 h-4" />
        }
        {saved ? '✅ Saved!' : 'Save All Settings'}
      </button>
    </div>
  )
}
