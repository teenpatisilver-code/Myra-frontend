import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([])

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setCustomers(data || []))
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Customers</h2>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800">
            <tr className="text-gray-400">
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Admin</th>
              <th className="text-left p-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                <td className="p-4">{c.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${c.is_admin ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700 text-gray-400'}`}>
                    {c.is_admin ? 'Admin' : 'Customer'}
                  </span>
                </td>
                <td className="p-4 text-gray-400 text-xs">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
