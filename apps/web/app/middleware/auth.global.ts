export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  const publicPages = ['/login', '/register']
  const isPublic = publicPages.includes(to.path)

  // If not authenticated and trying to access a protected page, redirect to login
  if (!auth.token && !isPublic) {
    return navigateTo('/login')
  }

  // If authenticated and trying to access login/register, redirect to home
  if (auth.token && isPublic) {
    return navigateTo('/')
  }
})
