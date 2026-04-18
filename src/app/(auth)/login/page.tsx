"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    try {
      // 1. Coba Login ke Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;

      // 2. Baca "Papan Pengumuman" (Tabel Profiles) untuk melihat jabatan
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (profileError) {
        console.error("Gagal mengambil profil:", profileError);
        // Jika karena suatu hal profil tidak ditemukan, lempar ke Kasir sebagai default aman
        router.push("/login");
        return;
      }

      // 3. Routing Pintar (Smart Redirect) berdasarkan Jabatan
      if (profileData.role === "OWNER") {
        router.push("/admin"); // Owner masuk ke Dashboard Admin
      } else {
        router.push("/pos"); // Kasir masuk ke halaman Buka Shift
      }
    } catch (err: any) {
      setError(
        err.message || "Gagal login. Periksa kembali email dan password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-surface font-body text-on-surface antialiased">
      {/* Left Panel: Branding (Hidden on Mobile) */}
      <section className="hidden md:flex w-1/2 hero-gradient relative overflow-hidden flex-col items-center justify-center p-12 text-on-primary">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border-[40px] border-white"></div>
          <div className="absolute bottom-12 right-12 w-64 h-64 rounded-full bg-white blur-3xl opacity-20"></div>
        </div>
        <div className="relative z-10 text-center max-w-lg">
          <h1 className="font-headline text-7xl font-extrabold tracking-tighter mb-6">
            POSINAJA
          </h1>
          <p className="text-2xl font-light leading-relaxed opacity-90 tracking-tight">
            Manage your retail business with speed and precision.
          </p>
          <div className="mt-16 grid grid-cols-2 gap-6 text-left">
            <div className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl">
              <div className="text-white mb-3 text-2xl">⚡</div>
              <h3 className="font-headline font-bold text-lg">Real-time Sync</h3>
              <p className="text-sm opacity-80">Instant inventory updates across all outlets.</p>
            </div>
            <div className="p-6 bg-white/10 backdrop-blur-xl rounded-2xl">
              <div className="text-white mb-3 text-2xl">📊</div>
              <h3 className="font-headline font-bold text-lg">Advanced Data</h3>
              <p className="text-sm opacity-80">Deep dive into sales trends and staff performance.</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 text-sm opacity-60">
          © 2024 POSinAja. All rights reserved.
        </div>
      </section>

      {/* Right Panel: Auth Form */}
      <section className="w-full md:w-1/2 flex items-center justify-center bg-surface-container-lowest p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-12">
            <span className="font-headline text-3xl font-extrabold text-primary tracking-tighter">POSINAJA</span>
          </div>

          <header className="mb-10">
            <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-2">
              Welcome Back
            </h2>
            <p className="text-on-surface-variant text-lg">
              Please enter your details to sign in to your shift.
            </p>
          </header>

          {error && (
            <div className="mb-6 bg-error-container border-l-4 border-error p-4 rounded-r-lg">
              <p className="text-sm text-on-error-container font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                </div>
                <input
                  className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm"
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </div>
                <input
                  className="block w-full pl-12 pr-12 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all text-sm"
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" x2="23" y1="1" y2="23" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                className="group relative w-full flex justify-center py-4 px-6 text-lg font-bold rounded-xl text-on-primary hero-gradient ambient-shadow active:scale-95 transition-all duration-200 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Memproses...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
              </button>
            </div>
          </form>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-surface-container flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-on-surface-variant">
            <span>Privacy Policy</span>
            <span className="hidden md:block w-1 h-1 bg-outline-variant rounded-full"></span>
            <span>Terms of Service</span>
            <span className="hidden md:block w-1 h-1 bg-outline-variant rounded-full"></span>
            <span>Support</span>
          </footer>
        </div>
      </section>

      {/* Background Decoration */}
      <div className="fixed top-0 right-0 -z-10 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-1/4 h-1/4 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
    </main>
  );
}
