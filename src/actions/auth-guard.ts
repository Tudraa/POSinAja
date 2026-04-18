import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function verifyOwnerAccess() {
  // 1. Ambil brankas cookie dari browser (di Next.js terbaru, ini harus di-await)
  const cookieStore = await cookies();

  // 2. Berikan cookie tersebut ke fungsi Supabase milikmu
  const supabase = createClient(cookieStore);

  // 3. Cek apakah ada user yang sedang login di sesi ini
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: Anda belum login.");
  }

  // 4. Cek apakah role-nya OWNER (Pastikan kamu punya tabel profiles dengan kolom role)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "OWNER") {
    throw new Error("Forbidden: Hanya Owner yang dapat melakukan aksi ini.");
  }

  return true; // Lulus pengecekan, aksi boleh dilanjutkan!
}
