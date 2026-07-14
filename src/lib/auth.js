import { supabase } from './supabase'

export async function signInAdministrator(email, password) {
  const cleanEmail = email.trim().toLowerCase()

  if (!cleanEmail || !password) {
    throw new Error('Veuillez compléter l’adresse e-mail et le mot de passe.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  })

  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      throw new Error('Adresse e-mail ou mot de passe incorrect.')
    }

    if (error.message.toLowerCase().includes('email not confirmed')) {
      throw new Error('Votre adresse e-mail doit encore être confirmée.')
    }

    console.error(error)

    throw new Error(error.message)

  return data
}

export async function signOutAdministrator() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error('La déconnexion a échoué. Réessayez.')
  }
}

export async function sendPasswordReset(email) {
  const cleanEmail = email.trim().toLowerCase()

  if (!cleanEmail) {
    throw new Error('Indiquez d’abord votre adresse e-mail.')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: window.location.origin,
  })

  if (error) {
    throw new Error('Impossible d’envoyer l’e-mail de réinitialisation.')
  }
}
