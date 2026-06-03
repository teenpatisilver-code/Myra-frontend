import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export function useAdminGuard() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        window.location.href = '/auth'
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (data?.is_admin === true) {
        setIsAdmin(true)
      } else {
        window.location.href = '/'
      }
      setLoading(false)
    })
  }, [])

  return { loading, isAdmin }
}
