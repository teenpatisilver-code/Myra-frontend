import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
  image_url?: string | null
}

export interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  is_featured: boolean
  is_available: boolean
  category_id?: string | null
  created_at: string
}

export const useCategories = () => {
  const [data, setData] = useState<Category[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data: categories, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true })

        if (error) throw error
        setData(categories)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load categories')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { data, isLoading, error }
}

export const useMenuItems = () => {
  const [data, setData] = useState<MenuItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const { data: items, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setData(items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load menu items')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenuItems()
  }, [])

  return { data, isLoading, error }
}

export const useFeaturedMenuItems = () => {
  const [data, setData] = useState<MenuItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        const { data: items, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_featured', true)
          .eq('is_available', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        setData(items)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load featured items')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedItems()
  }, [])

  return { data, isLoading, error }
}
