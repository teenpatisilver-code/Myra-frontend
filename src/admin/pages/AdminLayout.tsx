import { useState } from 'react'
import { useLocation } from 'wouter'
import { LayoutDashboard, ShoppingBag, Coffee, Tag, Users, LogOut, Menu, X, Zap, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
  { label: 'Drinks', icon: Coffee, path: '/admin/drinks' },
  { label: 'Categories', icon: Tag, path: '/admin/categories' },
  { label: 'Customers', icon: Users, path: '/admin/customers' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gray-950 border-r border-gray-800">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Zap size={16} className="text-black" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Myra Drinks</p>
            <p className="text-xs text-amber-500">Admin Panel</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ label, icon: Icon, path }) => {
          const active = location === path
          return (
            <button
              key={path}
              onClick={() => { setLocation(path); setOpen(false) }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={16} />
                {label}
              </div>
              {active && <ChevronRight size={14} />}
            </button>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-800 space-y-2">
        <button
          onClick={() => setLocation('/')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        >
          <ChevronRight size={16} className="rotate-180" />
          Back to App
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <div className="hidden md:flex w-56 flex-shrink-0 flex-col fixed inset-y-0">
        <Sidebar />
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-64 flex flex-col"><Sidebar /></div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <Zap size={13} className="text-black" />
            </div>
            <span className="font-bold text-sm">Myra Admin</span>
          </div>
          <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
