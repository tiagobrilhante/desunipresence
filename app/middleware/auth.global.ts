export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()

  if (import.meta.server && to.path === '/') {
    return
  }

  if (import.meta.client) {
    const { data: sessionData } = await supabase.auth.getSession()

    if (sessionData.session && !user.value) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  if (user.value && to.path === '/') {
    return navigateTo('/home')
  }

  const protectedRoutes = ['/home', '/groups']
  const isProtectedRoute = protectedRoutes.some(route => to.path.startsWith(route))

  if (!user.value && isProtectedRoute) {
    return navigateTo('/')
  }
})
