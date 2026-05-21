import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string | null
  image_url?: string | null
  emoji?: string | null  // ✅ added
}

export interface MenuItem {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  price: number
  discountPercent?: number | null
  discountFixed?: number | null
  calories?: number | null
  protein?: number | null
  categoryName?: string | null
  isAvailable: boolean
  is_featured: boolean
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
          .from('drinks')
          .select('*, categories(name)')
          .eq('is_available', true)
          .order('sort_order', { ascending: true })
        if (error) throw error
        const mapped = (items ?? []).map((item: any) => ({
          id: String(item.id),
          name: item.name,
          description: item.description,
          imageUrl: item.image_url,
          price: Number(item.price),
          discountPercent: item.discount_percent ? Number(item.discount_percent) : null,
          discountFixed: item.discount_fixed ? Number(item.discount_fixed) : null,
          calories: item.calories,
          protein: item.protein ? Number(item.protein) : null,
          categoryName: item.categories?.name ?? null,
          isAvailable: item.is_available,
          is_featured: item.is_featured,
          created_at: item.created_at,
        }))
        setData(mapped)
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
          .from('drinks')
          .select('*, categories(name)')
          .eq('is_featured', true)
          .eq('is_available', true)
          .order('sort_order', { ascending: true })
        if (error) throw error
        const mapped = (items ?? []).map((item: any) => ({
          id: String(item.id),
          name: item.name,
          description: item.description,
          imageUrl: item.image_url,
          price: Number(item.price),
          discountPercent: item.discount_percent ? Number(item.discount_percent) : null,
          discountFixed: item.discount_fixed ? Number(item.discount_fixed) : null,
          calories: item.calories,
          protein: item.protein ? Number(item.protein) : null,
          categoryName: item.categories?.name ?? null,
          isAvailable: item.is_available,
          is_featured: item.is_featured,
          created_at: item.created_at,
        }))
        setData(mapped)
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
