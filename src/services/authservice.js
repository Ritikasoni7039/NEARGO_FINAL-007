import { supabase } from '../supabaseClient'

// Sign Up function with Role
export const signUpUser = async (email, password, role) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  if (data?.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: data.user.id, email, role }])

    if (profileError) throw profileError
  }

  return data
}

// Sign In function
export const signInUser = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // User ka role check karna
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError) throw profileError

  return { user: data.user, session: data.session, role: profile.role }
}

// Logout function
export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}