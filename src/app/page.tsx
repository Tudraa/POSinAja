import { cookies } from "next/headers"; // <-- 1. Import cookies bawaan Next.js
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  // 2. Ambil brankas cookie secara asinkron (karena ada tipe Awaited)
  const cookieStore = await cookies();

  // 3. Masukkan cookieStore sebagai argumen ke dalam createClient!
  const supabase = createClient(cookieStore);

  // Coba "Ping" database dengan mengambil data dari tabel products (limit 1)
  const { data, error } = await supabase.from("products").select("*").limit(1);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      <h1 className="text-3xl font-black mb-8 text-slate-900">
        Radar Koneksi Supabase
      </h1>

      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
        {error ? (
          <div className="text-red-500">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>❌</span> Koneksi Gagal!
            </h2>
            <p className="text-sm mt-3 text-red-400 bg-red-50 p-3 rounded-lg border border-red-100">
              {error.message}
            </p>
          </div>
        ) : (
          <div className="text-emerald-500">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>✅</span> Koneksi Berhasil!
            </h2>
            <p className="text-sm mt-3 text-slate-600">
              Next.js berhasil menembus Supabase melalui jalur SSR.
            </p>
            <div className="mt-4 p-4 bg-slate-900 rounded-xl overflow-hidden">
              <pre className="text-emerald-400 text-xs overflow-x-auto">
                {data && data.length > 0
                  ? JSON.stringify(data, null, 2)
                  : "[] \n\n(Tabel products masih kosong, tapi koneksi aman 100%!)"}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
