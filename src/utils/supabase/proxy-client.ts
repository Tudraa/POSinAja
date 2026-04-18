import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export function createProxyClient(
  request: NextRequest,
  response: NextResponse,
) {
  // Kita ambil langsung dari process.env di sini
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Kita tidak buat NextResponse.next baru di sini agar tidak loop
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
}
