import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export function useAdminGuard() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        window.location.href = '/login'
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!data?.is_admin) {
        window.location.href = '/'
        return
      }
      setIsAdmin(true)
      setLoading(false)
    })
  }, [])

  return { loading, isAdmin }
}
