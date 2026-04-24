"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { endShift } from "@/actions/shift";
import { LogOut, X } from "lucide-react";

interface EndShiftButtonProps {
  shiftId: string;
}

export default function EndShiftButton({ shiftId }: EndShiftButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [actualCash, setActualCash] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEndShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Tutup shift di database
      const cashNumber = Number(actualCash);
      const shiftResult = await endShift(shiftId, cashNumber);

      if (!shiftResult.success) {
        alert("Gagal menutup shift: " + shiftResult.message);
        setIsLoading(false);
        return;
      }

      // 2. Logout dari Supabase
      await supabase.auth.signOut({ scope: "global" });
      localStorage.clear();
      sessionStorage.clear();

      // 3. Redirect ke halaman login
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Terjadi kesalahan:", error);
      alert("Terjadi kesalahan sistem saat logout.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button — matches the pos page header style */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2 rounded-xl border border-outline/30 text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center gap-2"
      >
        <LogOut size={18} className="text-error" />
        Keluar Shift
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline/10">
              <div>
                <h2 className="font-headline font-bold text-xl text-on-surface">
                  Tutup Sesi Kasir
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hitung uang fisik di laci kasir
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="p-2 rounded-xl text-slate-400 hover:bg-surface-container-low hover:text-on-surface transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEndShift} className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Total Uang Tunai Akhir
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low rounded-xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest text-sm text-on-surface focus:outline-none transition-all"
                    placeholder="Contoh: 1500000"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl border border-outline/30 text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !actualCash}
                  className="flex-1 py-3 rounded-xl bg-error text-on-error text-sm font-semibold hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-on-error" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <LogOut size={16} />
                      Tutup Shift
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
