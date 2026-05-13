import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDrinks(categoryId?: string) {
  const [drinks, setDrinks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let query = supabase
      .from('drinks')
      .select('*, categories(name, emoji)')
      .eq('available', true)

    if (categoryId) query = query.eq('category_id', categoryId)

    query.then(({ data }) => {
      setDrinks(data || [])
      setLoading(false)
    })
  }, [categoryId])

  return { drinks, loading }
}
