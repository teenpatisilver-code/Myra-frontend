const save = async () => {
  const name = form.name?.trim()
  const price = form.price?.toString().trim()
  
  if (!name || !price || isNaN(parseFloat(price))) {
    alert('Name and price are required!')
    return
  }

  setSaving(true)

  const payload = {
    name,
    description: form.description || null,
    ingredients: form.ingredients || null,
    price: parseFloat(price),
    category_id: form.category_id || null,
    is_available: form.is_available,
    is_featured: form.is_featured,
    image_url: form.image_url || null,
    calories: form.calories ? parseInt(form.calories) : null,
    protein: form.protein ? parseFloat(form.protein) : null,
  }

  if (editing) {
    const { error } = await supabase.from('drinks').update(payload).eq('id', editing)
    if (error) { alert('Update failed: ' + error.message); setSaving(false); return }
  } else {
    const { error } = await supabase.from('drinks').insert(payload)
    if (error) { alert('Insert failed: ' + error.message); setSaving(false); return }
  }

  setForm(empty)
  setEditing(null)
  setShowForm(false)
  setSaving(false)
  fetchData()
}
