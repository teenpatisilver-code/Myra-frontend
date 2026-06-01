import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, X, Trash2, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'

export default function Recipes() {
  const [drinks, setDrinks] = useState<any[]>([])
  const [ingredients, setIngredients] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([])
  const [adding, setAdding] = useState(false)
  const [newIng, setNewIng] = useState({ ingredient_id: '', quantity_used: '', unit: 'g' })
  const [packagingCost, setPackagingCost] = useState(0)
  const [sellingPrice, setSellingPrice] = useState(0)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  const fetchAll = async () => {
    const [d, i] = await Promise.all([
      supabase.from('drinks').select('*, categories(name)').order('name'),
      supabase.from('ingredients').select('*').order('name'),
    ])
    setDrinks(d.data || [])
    setIngredients(i.data || [])
  }

  useEffect(() => { fetchAll() }, [])

  const loadRecipe = async (drink: any) => {
    setSelected(drink)
    setPackagingCost(drink.packaging_cost || 0)
    setSellingPrice(drink.price || 0)
    const { data } = await supabase
      .from('recipe_ingredients')
      .select('*, ingredients(*)')
      .eq('drink_id', drink.id)
    setRecipeIngredients(data || [])
  }

  const costPerUnit = (ing: any) => {
    if (!ing || !ing.purchase_quantity) return 0
    return Number(ing.purchase_cost) / Number(ing.purchase_quantity)
  }

  const calcIngredientCost = (ri: any) => {
    if (!ri.ingredients) return 0
    return costPerUnit(ri.ingredients) * Number(ri.quantity_used)
  }

  const totalIngredientCost = recipeIngredients.reduce((s, ri) => s + calcIngredientCost(ri), 0)
  const totalCost = totalIngredientCost + Number(packagingCost)
  const profit = Number(sellingPrice) - totalCost
  const margin = sellingPrice > 0 ? (profit / Number(sellingPrice)) * 100 : 0
  const recommendedPrice = totalCost * 1.4 // 40% markup

  const addIngredient = async () => {
    if (!newIng.ingredient_id || !newIng.quantity_used || !selected) return
    setSaving(true)
    await supabase.from('recipe_ingredients').insert({
      drink_id: selected.id,
      ingredient_id: parseInt(newIng.ingredient_id),
      quantity_used: parseFloat(newIng.quantity_used),
      unit: newIng.unit,
    })
    setNewIng({ ingredient_id: '', quantity_used: '', unit: 'g' })
    setAdding(false)
    setSaving(false)
    loadRecipe(selected)
  }

  const removeIngredient = async (id: number) => {
    await supabase.from('recipe_ingredients').delete().eq('id', id)
    loadRecipe(selected)
  }

  const savePrice = async () => {
    if (!selected) return
    setSaving(true)
    await supabase.from('drinks').update({
      price: sellingPrice,
      packaging_cost: packagingCost,
    }).eq('id', selected.id)
    setSaving(false)
    fetchAll()
    alert('Saved!')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — Drinks list */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Recipe Costing</h2>
        <p className="text-gray-400 text-sm mb-4">Select a drink to manage its recipe and pricing</p>
        <div className="space-y-2">
          {drinks.map(d => {
            const isOpen = expanded === d.id
            return (
              <div key={d.id} className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${selected?.id === d.id ? 'border-amber-500' : 'border-gray-800'}`}>
                <button
                  onClick={() => { loadRecipe(d); setExpanded(isOpen ? null : d.id) }}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div>
                    <h4 className="font-semibold text-white">{d.name}</h4>
                    <p className="text-xs text-gray-400">{d.categories?.name} · Rs {d.price}</p>
                  </div>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right — Recipe editor */}
      <div>
        {!selected ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
            <p className="text-4xl mb-3">🥤</p>
            <p>Select a drink from the left to manage its recipe</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Ingredients</h4>
                <button onClick={() => setAdding(!adding)}
                  className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/30">
                  <Plus size={12} /> Add
                </button>
              </div>

              {adding && (
                <div className="bg-gray-800 rounded-lg p-3 mb-3 space-y-2">
                  <select value={newIng.ingredient_id} onChange={e => {
                    const ing = ingredients.find(i => i.id === parseInt(e.target.value))
                    setNewIng(f => ({ ...f, ingredient_id: e.target.value, unit: ing?.unit || 'g' }))
                  }} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none">
                    <option value="">Select ingredient</option>
                    {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} (Rs {costPerUnit(i).toFixed(3)}/{i.unit})</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="number" value={newIng.quantity_used} onChange={e => setNewIng(f => ({ ...f, quantity_used: e.target.value }))}
                      placeholder="Quantity" className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none" />
                    <input value={newIng.unit} onChange={e => setNewIng(f => ({ ...f, unit: e.target.value }))}
                      placeholder="unit" className="w-20 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none" />
                    <button onClick={addIngredient} disabled={saving}
                      className="bg-amber-500 text-black px-3 py-2 rounded text-sm font-medium">Add</button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {recipeIngredients.map(ri => (
                  <div key={ri.id} className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm text-white">{ri.ingredients?.name}</p>
                      <p className="text-xs text-gray-400">{ri.quantity_used}{ri.unit}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 text-sm font-medium">Rs {calcIngredientCost(ri).toFixed(2)}</span>
                      <button onClick={() => removeIngredient(ri.id)} className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {recipeIngredients.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No ingredients added yet</p>
                )}
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="bg-gray-800 rounded-xl p-4 space-y-2">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-amber-400" /> Cost Breakdown
              </h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Ingredient Cost</span>
                <span className="text-white">Rs {totalIngredientCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-400">Packaging Cost</span>
                <input type="number" value={packagingCost}
                  onChange={e => setPackagingCost(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white text-right focus:outline-none" />
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2">
                <span className="text-gray-300">Total Cost</span>
                <span className="text-red-400">Rs {totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Recommended Price (40% markup)</span>
                <span className="text-green-400">Rs {recommendedPrice.toFixed(0)}</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-800 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-sm">Selling Price</h4>
              <input type="number" value={sellingPrice} onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-400">Profit</p>
                  <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>Rs {profit.toFixed(2)}</p>
                </div>
                <div className="text-center p-3 bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-400">Margin</p>
                  <p className={`text-lg font-bold ${margin >= 20 ? 'text-green-400' : 'text-yellow-400'}`}>{margin.toFixed(1)}%</p>
                </div>
              </div>
              <button onClick={savePrice} disabled={saving}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black py-2 rounded-lg text-sm font-medium">
                {saving ? 'Saving...' : 'Save Price & Cost'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
