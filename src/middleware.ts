import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/welcome(.*)',
  '/room(.*)',
  '/notifications(.*)',
  '/profile(.*)',
  '/my-tasks(.*)',
  '/api(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  try {
    // Log middleware execution for debugging
    console.log('Middleware executing for:', req.nextUrl.pathname)
    
    if (isProtectedRoute(req)) {
      console.log('Protecting route:', req.nextUrl.pathname)
      await auth.protect()
    }
    
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // In case of error, still allow the request to proceed
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
