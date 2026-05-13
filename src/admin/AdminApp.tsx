import { Switch, Route, useLocation } from 'wouter'
import AdminLayout from './AdminLayout'
import { useAdminGuard } from './hooks/useAdminGuard'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Drinks from './pages/Drinks'
import Categories from './pages/Categories'
import Customers from './pages/Customers'

export default function AdminApp() {
  const { loading, isAdmin } = useAdminGuard()

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
      Loading...
    </div>
  )

  if (!isAdmin) return null

  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/orders" component={Orders} />
        <Route path="/admin/drinks" component={Drinks} />
        <Route path="/admin/categories" component={Categories} />
        <Route path="/admin/customers" component={Customers} />
        <Route path="/admin" component={Dashboard} />
      </Switch>
    </AdminLayout>
  )
}
