import { defineMiddleware } from 'astro:middleware';

import { supabaseClient } from '../db/supabase.client.ts';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Check if user is authenticated
  const { data: { session } } = await supabaseClient.auth.getSession();

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/transactions', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => context.url.pathname.startsWith(route));

  // TODO: Uncomment when ready to enforce authentication on protected routes
  // Redirect unauthenticated users from protected routes to login
  // if (!session && isProtectedRoute) {
  //   return context.redirect('/login');
  // }

  // Redirect authenticated users from landing page to dashboard
  if (session && context.url.pathname === '/') {
    return context.redirect('/dashboard');
  }

  // Redirect authenticated users from login page to dashboard
  if (session && context.url.pathname === '/login') {
    return context.redirect('/dashboard');
  }

  return next();
});

