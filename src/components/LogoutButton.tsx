"use client";

import { createClient } from "@/utils/supabase/client";
import { LogOut } from "lucide-react";
import { useState } from "react";

export default function LogoutButton() {
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleHardLogout = async () => {
    setIsLoggingOut(true);

    try {
      // 1. Keluar dari Supabase (Scope global memastikan semua tab logout)
      await supabase.auth.signOut({ scope: "global" });

      // 2. Bersihkan semua data di LocalStorage (termasuk active_shift_id)
      localStorage.clear();

      // 3. Bersihkan SessionStorage (opsional tapi bagus untuk keamanan)
      sessionStorage.clear();

      // 4. HARD REDIRECT: Menggunakan window.location untuk membersihkan memory cache
      window.location.href = "/login";
    } catch (error) {
      console.error("Gagal logout:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleHardLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-slate-500 hover:text-red-500 tracking-tight transition-colors duration-200 active:scale-95 disabled:opacity-50"
    >
      {isLoggingOut ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
      ) : (
        <LogOut size={20} />
      )}
      <span>{isLoggingOut ? "Membersihkan Sesi..." : "Logout"}</span>
    </button>
  );
}
