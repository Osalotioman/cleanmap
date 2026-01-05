import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Proxy for authentication and route protection
 *
 * Protected routes:
 * - /dashboard
 * - /profile
 * - /report (requires auth)
 *
 * Public routes:
 * - /auth/login
 * - /auth/sign-up
 * - /map (public view)
 * - /
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const publicPaths = [
    "/",
    "/how-it-works",
    "/report",
    "/volunteers",
    "/auth/login",
    "/auth/sign-up",
    "/auth/sign-up-success",
    "/auth/error",
    "/auth/forgot-password",
    "/auth/update-password",
  ];

  // Define auth routes for special handling when a user is already logged in
  const authRoutes = ["/auth/login", "/auth/sign-up"];

  const isPublicPath = publicPaths.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);

  // If a logged-in user tries to access login/signup, redirect them to their profile
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // If the requested path is not public and there is no user, redirect to login
  if (!isPublicPath && !user) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
