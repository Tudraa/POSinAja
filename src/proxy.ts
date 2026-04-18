// proxy.ts (atau middleware.ts)
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "OWNER" | "CASHIER";

interface RouteConfig {
  path: string;
  allowedRoles: UserRole[];
  fallback: string; // where to redirect if role is denied
}

// ─── Route Config (single source of truth) ────────────────────────────────────

const PROTECTED_ROUTES: RouteConfig[] = [
  { path: "/admin", allowedRoles: ["OWNER"], fallback: "/pos" },
  { path: "/employees", allowedRoles: ["OWNER"], fallback: "/pos" },
  { path: "/pos", allowedRoles: ["CASHIER", "OWNER"], fallback: "/admin" },
  { path: "/shift", allowedRoles: ["CASHIER"], fallback: "/admin" },
];

const AUTH_ROUTES = ["/login"];

const ROLE_HOME: Record<UserRole, string> = {
  OWNER: "/admin",
  CASHIER: "/shift",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMatchingRoute(pathname: string): RouteConfig | undefined {
  return PROTECTED_ROUTES.find(({ path }) => pathname.startsWith(path));
}

function isProtected(pathname: string): boolean {
  return !!getMatchingRoute(pathname);
}

function redirect(url: string, request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL(url, request.url));
}

// ─── Middleware ────────────────────────────────────────────────────────────────

export default async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return redirect("/pos", request);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // ✅ Sudah diperbaiki sesuai standar

  // ✅ PATCH 1: Mencegah Infinite Redirect Loop
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Middleware: Missing Supabase env vars. Check .env.local");
    if (pathname !== "/login") {
      return redirect("/login", request);
    }
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.warn("⚠️ Middleware auth error:", authError.message);
    }

    // ── Unauthenticated ──────────────────────────────────────────────────────

    if (!user) {
      if (isProtected(pathname)) {
        return redirect("/login", request);
      }
      return response; // allow /login, /
    }

    // ── Authenticated: fetch role ────────────────────────────────────────────

    const role: UserRole = (user.app_metadata?.role as UserRole) || "CASHIER";

    // ── Redirect away from auth pages if already logged in ───────────────────

    if (AUTH_ROUTES.includes(pathname)) {
      return redirect(ROLE_HOME[role], request);
    }

    // ── Role-based access control ────────────────────────────────────────────

    const matchedRoute = getMatchingRoute(pathname);
    if (matchedRoute && !matchedRoute.allowedRoles.includes(role)) {
      return redirect(matchedRoute.fallback, request);
    }

    return response;
  } catch (error) {
    console.error("❌ Middleware unexpected error:", error);
    // ✅ PATCH 2: Menutup Celah Fail-Open
    // Jika middleware crash, dan user mencoba buka halaman rahasia, tendang ke login!
    if (isProtected(pathname)) {
      return redirect("/login", request);
    }
    return response;
  }
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
