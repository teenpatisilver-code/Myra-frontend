import { Switch, Route } from 'wouter'
import AdminLayout from './AdminLayout'
import { useAdminGuard } from './hooks/useAdminGuard'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Drinks from './pages/Drinks'
import Categories from './pages/Categories'
import Customers from './pages/Customers'
import Investors from './pages/Investors'
import Ingredients from './pages/Ingredients'
import Recipes from './pages/Recipes'
import Banners from './pages/Banners'
import Settings from './pages/Settings'

export default function AdminApp() {
  const { loading, isAdmin } = useAdminGuard()

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Checking admin access...</p>
      </div>
    </div>
  )

  if (!isAdmin) return (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
      <p>Not authorized. <a href="/auth" className="text-amber-400">Login</a></p>
    </div>
  )

  return (
    <AdminLayout>
      <Switch>
        <Route path="/admin/orders" component={Orders} />
        <Route path="/admin/drinks" component={Drinks} />
        <Route path="/admin/categories" component={Categories} />
        <Route path="/admin/ingredients" component={Ingredients} />
        <Route path="/admin/recipes" component={Recipes} />
        <Route path="/admin/customers" component={Customers} />
        <Route path="/admin/investors" component={Investors} />
        <Route path="/admin/banners" component={Banners} />
        <Route path="/admin/settings" component={Settings} />
        <Route path="/admin" component={Dashboard} />
      </Switch>
    </AdminLayout>
  )
}
