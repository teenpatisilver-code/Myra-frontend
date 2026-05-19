import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const ADMIN_ID = '356e544f-7fe4-429f-831d-c033cb43bfc6'

export function useAdminGuard() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        window.location.href = '/auth'
        return
      }
      if (user.id === ADMIN_ID) {
        setIsAdmin(true)
        setLoading(false)
        return
      }
      setLoading(false)
      window.location.href = '/'
    })
  }, [])

  return { loading, isAdmin }
}
