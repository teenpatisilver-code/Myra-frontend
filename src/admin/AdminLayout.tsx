import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import {
  LayoutDashboard, ShoppingBag, Coffee,
  Tag, Users, LogOut, Menu, X
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/drinks', label: 'Drinks', icon: Coffee },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const [open, setOpen] = useState(false)

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800
        transform transition-transform duration-200 flex flex-col
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-amber-400">Myra Admin</h1>
          <p className="text-xs text-gray-400 mt-1">Control Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <a
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${location === href
                    ? 'bg-amber-500 text-black'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'}
                `}
              >
                <Icon size={18} />
                {label}
              </a>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-4">
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-sm text-gray-400 ml-auto">Myra Drinks Dashboard</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
