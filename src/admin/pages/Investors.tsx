import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, Upload, X, Search } from 'lucide-react'

const RELATIONSHIP_TYPES = ['Investor', 'Owner', 'Funder', 'Family', 'Friend', 'Employee']
const REPAYMENT_STATUSES = ['pending', 'partial', 'completed', 'none']

type InvestorForm = {
  full_name: string
  role: string
  relationship_type: string
  investment_amount: string
  loan_amount: string
  equity_percentage: string
  repayment_status: string
  notes: string
  profile_picture: string
}

const empty: InvestorForm = {
  full_name: '',
  role: '',
  relationship_type: 'Investor',
  investment_amount: '',
  loan_amount: '',
  equity_percentage: '',
  repayment_status: 'pending',
  notes: '',
  profile_picture: '',
}

export default function Investors() {
  const [investors, setInvestors] = useState<any[]>([])
  const [form, setForm] = useState<InvestorForm>(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchInvestors = async () => {
    const { data } = await supabase
      .from('investors')
      .select('*')
      .order('created_at', { ascending: false })
    setInvestors(data || [])
  }

  useEffect(() => { fetchInvestors() }, [])

  const filtered = investors.filter(inv => {
    const matchesFilter = filter === 'All' || inv.relationship_type === filter
    const matchesSearch = !search ||
      inv.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.role?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const uploadPicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `investors/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('images').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path)
      setForm(f => ({ ...f, profile_picture: data.publicUrl }))
    } else {
      alert('Upload failed: ' + error.message)
    }
    setUploading(false)
  }

  const save = async () => {
    if (!form.full_name.trim()) { alert('Name is required!'); return }
    setSaving(true)
    const payload = {
      full_name: form.full_name.trim(),
      role: form.role.trim() || null,
      relationship_type: form.relationship_type,
      investment_amount: form.investment_amount !== '' ? parseFloat(form.investment_amount) : 0,
      loan_amount: form.loan_amount !== '' ? parseFloat(form.loan_amount) : 0,
      equity_percentage: form.equity_percentage !== '' ? parseFloat(form.equity_percentage) : 0,
      repayment_status: form.repayment_status,
      notes: form.notes.trim() || null,
      profile_picture: form.profile_picture || null,
    }
    try {
      if (editing) {
        const { error } = await supabase.from('investors').update(payload).eq('id', editing)
        if (error) throw error
      } else {
        const { error } = await supabase.from('investors').insert(payload)
        if (error) throw error
      }
      setForm(empty)
      setEditing(null)
      setShowForm(false)
      await fetchInvestors()
    } catch (err: any) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const edit = (inv: any) => {
    setForm({
      full_name: inv.full_name || '',
      role: inv.role || '',
      relationship_type: inv.relationship_type || 'Investor',
      investment_amount: inv.investment_amount?.toString() || '',
      loan_amount: inv.loan_amount?.toString() || '',
      equity_percentage: inv.equity_percentage?.toString() || '',
      repayment_status: inv.repayment_status || 'pending',
      notes: inv.notes || '',
      profile_picture: inv.profile_picture || '',
    })
    setEditing(inv.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const del = async (id: string) => {
    if (!confirm('Delete this member?')) return
    await supabase.from('investors').delete().eq('id', id)
    fetchInvestors()
  }

  const typeColor: Record<string, string> = {
    Investor: 'bg-amber-500/20 text-amber-400',
    Owner: 'bg-purple-500/20 text-purple-400',
    Funder: 'bg-blue-500/20 text-blue-400',
    Family: 'bg-green-500/20 text-green-400',
    Friend: 'bg-pink-500/20 text-pink-400',
    Employee: 'bg-gray-500/20 text-gray-400',
  }

  const repayColor: Record<string, string> = {
    pending: 'text-yellow-400',
    partial: 'text-orange-400',
    completed: 'text-green-400',
    none: 'text-gray-500',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Investment Tracker</h2>
          <p className="text-gray-400 text-sm">Myra Mocktail Bar — {investors.length} members</p>
        </div>
        <button
          onClick={() => { setForm(empty); setEditing(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Investors', value: investors.filter(i => i.relationship_type === 'Investor').length, color: 'text-amber-400' },
          { label: 'Total Investment', value: `Rs ${investors.reduce((s, i) => s + (i.investment_amount || 0), 0).toLocaleString()}`, color: 'text-green-400' },
          { label: 'Total Loans', value: `Rs ${investors.reduce((s, i) => s + (i.loan_amount || 0), 0).toLocaleString()}`, color: 'text-red-400' },
          { label: 'Equity Given', value: `${investors.reduce((s, i) => s + (i.equity_percentage || 0), 0).toFixed(1)}%`, color: 'text-purple-400' },
          { label: 'Employees', value: investors.filter(i => i.relationship_type === 'Employee').length, color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editing ? 'Edit' : 'Add'} Member</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Profile Picture */}
            <div className="sm:col-span-2 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                {form.profile_picture
                  ? <img src={form.profile_picture} className="w-full h-full object-cover" alt="preview" />
                  : <span className="text-2xl text-gray-500">👤</span>
                }
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Profile Picture</label>
                <label className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-pointer hover:border-amber-500">
                  <Upload size={14} />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadPicture} className="hidden" />
                </label>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Full Name *</label>
              <input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="e.g. Aarav Sharma"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Role / Title</label>
              <input
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Co-Founder, Barista"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Relationship Type */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Type</label>
              <select
                value={form.relationship_type}
                onChange={e => setForm(f => ({ ...f, relationship_type: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {RELATIONSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Repayment Status */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Repayment Status</label>
              <select
                value={form.repayment_status}
                onChange={e => setForm(f => ({ ...f, repayment_status: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {REPAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Investment Amount */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Investment Amount (Rs)</label>
              <input
                type="number"
                value={form.investment_amount}
                onChange={e => setForm(f => ({ ...f, investment_amount: e.target.value }))}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Loan Amount */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Loan Amount (Rs)</label>
              <input
                type="number"
                value={form.loan_amount}
                onChange={e => setForm(f => ({ ...f, loan_amount: e.target.value }))}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Equity */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Equity %</label>
              <input
                type="number"
                value={form.equity_percentage}
                onChange={e => setForm(f => ({ ...f, equity_percentage: e.target.value }))}
                placeholder="0"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Any additional notes..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={save}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-4 py-2 rounded-lg text-sm font-medium"
            >
              {saving ? 'Saving...' : editing ? 'Update Member' : 'Add Member'}
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

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or role..."
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', ...RELATIONSHIP_TYPES].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr className="text-gray-400 text-xs">
              <th className="text-left p-4">Member</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Type</th>
              <th className="text-left p-4">Investment</th>
              <th className="text-left p-4">Loan</th>
              <th className="text-left p-4">Equity</th>
              <th className="text-left p-4">Repayment</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  {investors.length === 0 ? 'No members added yet.' : 'No results found.'}
                </td>
              </tr>
            )}
            {filtered.map(inv => (
              <tr key={inv.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-800 border border-gray-700 shrink-0 flex items-center justify-center">
                      {inv.profile_picture
                        ? <img src={inv.profile_picture} className="w-full h-full object-cover" alt={inv.full_name} />
                        : <span className="text-sm font-bold text-amber-400">{inv.full_name?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div>
                      <p className="font-medium text-white">{inv.full_name}</p>
                      {inv.notes && <p className="text-xs text-gray-500 truncate max-w-[120px]">{inv.notes}</p>}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-300 text-xs">{inv.role || '—'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor[inv.relationship_type] || 'bg-gray-700 text-gray-400'}`}>
                    {inv.relationship_type}
                  </span>
                </td>
                <td className="p-4 text-green-400 font-medium">
                  {inv.investment_amount > 0 ? `Rs ${inv.investment_amount.toLocaleString()}` : '—'}
                </td>
                <td className="p-4 text-red-400 font-medium">
                  {inv.loan_amount > 0 ? `Rs ${inv.loan_amount.toLocaleString()}` : '—'}
                </td>
                <td className="p-4 text-purple-400 font-medium">
                  {inv.equity_percentage > 0 ? `${inv.equity_percentage}%` : '—'}
                </td>
                <td className="p-4">
                  <span className={`text-xs font-medium capitalize ${repayColor[inv.repayment_status] || 'text-gray-400'}`}>
                    {inv.repayment_status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => edit(inv)} className="text-gray-400 hover:text-white p-1">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => del(inv.id)} className="text-gray-400 hover:text-red-400 p-1">
                      <Trash2 size={14} />
                    </button>
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
