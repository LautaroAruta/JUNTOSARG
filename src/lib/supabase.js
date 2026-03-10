// src/lib/supabase.js
// ─────────────────────────────────────────────
// Reemplazá estos valores con los de tu proyecto
// Supabase → Settings → API → Project URL y anon key
// ─────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || 'https://TU_PROYECTO.supabase.co'
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TU_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  true,
  },
})

// ── Helpers de auth ───────────────────────────
export const signUp = async ({ email, password, name, phone }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone },
      emailRedirectTo: `${window.location.origin}/`,
    },
  })
  return { data, error }
}

export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/` },
  })
  return { data, error }
}

export const signOut = async () => {
  await supabase.auth.signOut()
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ── Helpers de datos ──────────────────────────
export const getProducts = async ({ category, search } = {}) => {
  let query = supabase
    .from('products')
    .select(`
      *,
      stores ( id, name, emoji, address, rating ),
      groups ( id, current_buyers, min_buyers, status, expires_at )
    `)
    .eq('active', true)
    .eq('approved', true)
    .order('featured', { ascending: false })

  if (category && category !== 'Todos') query = query.eq('category', category)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error } = await query
  return { data: data || [], error }
}

export const getProduct = async (id) => {
  const { data, error } = await supabase
    .from('products')
    .select(`*, stores(*), groups(*), reviews(*, users(name))`)
    .eq('id', id)
    .single()
  return { data, error }
}

export const joinGroup = async (groupId, userId) => {
  // Usa una función RPC en Supabase para manejar el lock atómico
  const { data, error } = await supabase.rpc('join_group', {
    p_group_id: groupId,
    p_user_id:  userId,
  })
  return { data, error }
}

export const getMyOrders = async (userId) => {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      *,
      groups (
        *,
        products ( name, emoji, price_individual, price_group, stores(name, address) )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

export const toggleFavorite = async (userId, productId) => {
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()

  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('favorites').insert({ user_id: userId, product_id: productId })
    return true
  }
}

export const getMyFavorites = async (userId) => {
  const { data } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', userId)
  return data?.map(f => f.product_id) || []
}

export const getStores = async () => {
  const { data } = await supabase
    .from('stores')
    .select('*')
    .eq('approved', true)
    .order('rating', { ascending: false })
  return data || []
}

export const getDemands = async () => {
  const { data } = await supabase
    .from('demands')
    .select('*')
    .eq('status', 'open')
    .order('votes', { ascending: false })
  return data || []
}

export const voteDemand = async (demandId, userId) => {
  const { error } = await supabase.from('demand_votes').insert({
    demand_id: demandId,
    user_id:   userId,
  })
  if (!error) {
    await supabase.rpc('increment_demand_votes', { p_demand_id: demandId })
  }
  return !error
}

export const getNotifications = async (userId) => {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return data || []
}

export const markAllNotificationsRead = async (userId) => {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
}

// ── Realtime: suscribirse a cambios de un grupo ─
export const subscribeToGroup = (groupId, callback) => {
  return supabase
    .channel(`group:${groupId}`)
    .on('postgres_changes', {
      event:  'UPDATE',
      schema: 'public',
      table:  'groups',
      filter: `id=eq.${groupId}`,
    }, callback)
    .subscribe()
}
