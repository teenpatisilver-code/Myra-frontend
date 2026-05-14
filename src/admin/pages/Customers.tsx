import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Search } from 'lucide-react'

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setCustomers(data || []))
  }, [])

  const filtered = customers.filter(c =>
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-gray-400 text-sm mt-1">{customers.length} total users</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr className="text-gray-400 text-xs">
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-4 text-gray-300">{c.email || '—'}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.is_admin ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {c.is_admin ? 'Admin' : 'Customer'}
                  </span>
                </td>
                <td className="p-4 text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={3} className="p-8 text-center text-gray-500">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
