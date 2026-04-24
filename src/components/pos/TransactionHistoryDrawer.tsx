"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Banknote,
  QrCode,
  TrendingUp,
  ScrollText,
  CreditCard,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatRupiah } from "@/utils/format";
import {
  getTransactionsByShift,
  requestCancelTransaction,
  type Transaction,
} from "@/actions/transaction";

// --- Badge helper ---
const getPaymentBadge = (method: string) => {
  switch (method) {
    case "CASH":
      return {
        label: "Cash",
        Icon: Banknote,
        className: "bg-emerald-50 text-emerald-600",
      };
    case "QRIS":
      return {
        label: "QRIS",
        Icon: QrCode,
        className: "bg-blue-50 text-blue-500",
      };
    case "DEBIT":
      return {
        label: "Debit",
        Icon: CreditCard,
        className: "bg-purple-50 text-purple-600",
      };
    default:
      return {
        label: method,
        Icon: Banknote,
        className: "bg-slate-50 text-slate-500",
      };
  }
};

// --- Status badge helper ---
const getStatusBadge = (status: Transaction["status"]) => {
  switch (status) {
    case "COMPLETED":
      return null; // No badge for normal completed transactions
    case "CANCEL_REQUEST":
      return {
        label: "Minta Batal",
        className: "bg-amber-50 text-amber-600 border border-amber-200",
        Icon: Clock,
      };
    case "CANCELED":
      return {
        label: "Dibatalkan",
        className: "bg-red-50 text-red-500 border border-red-200",
        Icon: X,
      };
    case "CANCELED_REJECTED":
      return {
        label: "Batal Ditolak",
        className: "bg-slate-50 text-slate-500 border border-slate-200",
        Icon: AlertCircle,
      };
    default:
      return null;
  }
};

/**
 * Revenue rule per status:
 *  COMPLETED        → ✅ counted
 *  CANCEL_REQUEST   → ✅ counted (money still physically in drawer)
 *  CANCELED         → ❌ NOT counted
 *  CANCELED_REJECTED → ✅ counted
 */
function isCountedAsRevenue(status: Transaction["status"]): boolean {
  return status !== "CANCELED";
}

// --- Props ---
interface TransactionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId: string;
}

export default function TransactionHistoryDrawer({
  isOpen,
  onClose,
  shiftId,
}: TransactionHistoryDrawerProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!shiftId) return;
    setIsLoading(true);
    const result = await getTransactionsByShift(shiftId);
    if (result.success && result.data) {
      setTransactions(result.data);
    }
    setIsLoading(false);
  }, [shiftId]);

  // Refresh whenever the drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, fetchTransactions]);

  const handleRequestCancel = async (tx: Transaction) => {
    if (tx.status !== "COMPLETED") return; // Already in a cancel flow

    const reason = window.prompt(
      `Alasan pembatalan untuk ${tx.customer_name || "transaksi ini"}:`,
    );
    if (!reason || reason.trim() === "") return;

    setCancellingId(tx.id);
    const result = await requestCancelTransaction(tx.id, reason.trim());
    if (!result.success) {
      alert("Gagal mengajukan pembatalan: " + result.message);
    }
    setCancellingId(null);
    await fetchTransactions(); // Refresh list
  };

  // ── Computed summaries (revenue logic applied) ──
  const revenueTxs = transactions.filter((t) => isCountedAsRevenue(t.status));
  const totalRevenue = revenueTxs.reduce((s, t) => s + t.total_amount, 0);
  const totalCash = revenueTxs
    .filter((t) => t.payment_method === "CASH")
    .reduce((s, t) => s + t.total_amount, 0);
  const totalQris = revenueTxs
    .filter((t) => t.payment_method === "QRIS")
    .reduce((s, t) => s + t.total_amount, 0);
  const totalDebit = revenueTxs
    .filter((t) => t.payment_method === "DEBIT")
    .reduce((s, t) => s + t.total_amount, 0);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatOrderId = (id: string) => {
    return "#" + id.slice(0, 8).toUpperCase();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-[600px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline/10">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-primary-fixed rounded-xl text-primary">
              <ScrollText size={20} />
            </span>
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface leading-tight">
                Riwayat Transaksi
              </h2>
              <p className="text-xs text-slate-400">Shift Ini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-surface-container-low hover:text-on-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Summary Card ── */}
        <div className="px-6 pt-5 pb-2">
          <div className="bg-surface-container-low rounded-2xl p-5">
            {/* Total Pendapatan — full width */}
            <div className="pb-4 border-b border-outline/10 mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Total Pendapatan
              </p>
              <p
                className="font-headline font-extrabold text-3xl"
                style={{ color: "#f97316" }}
              >
                {formatRupiah(totalRevenue)}
              </p>
            </div>

            {/* 4-column sub-stats (Cash, QRIS, Debit, Order) */}
            <div className="grid grid-cols-4 gap-4">
              {/* Cash */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Banknote size={13} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Cash
                  </p>
                </div>
                <p className="font-headline font-bold text-sm text-on-surface">
                  {formatRupiah(totalCash)}
                </p>
              </div>

              {/* QRIS */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <QrCode size={13} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    QRIS
                  </p>
                </div>
                <p className="font-headline font-bold text-sm text-on-surface">
                  {formatRupiah(totalQris)}
                </p>
              </div>

              {/* Debit */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <CreditCard size={13} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Debit
                  </p>
                </div>
                <p className="font-headline font-bold text-sm text-on-surface">
                  {formatRupiah(totalDebit)}
                </p>
              </div>

              {/* Order Count (only counted transactions) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <TrendingUp size={13} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    Order
                  </p>
                </div>
                <p className="font-headline font-bold text-sm text-on-surface">
                  {revenueTxs.length} TRX
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Transaction List ── */}
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6 hide-scrollbar">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Daftar Transaksi
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
              <ScrollText size={32} className="opacity-20" />
              <p className="text-sm">Belum ada transaksi di shift ini</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-outline/10 overflow-hidden">
              {transactions.map((tx, i) => {
                const badge = getPaymentBadge(tx.payment_method);
                const statusBadge = getStatusBadge(tx.status);
                const BadgeIcon = badge.Icon;
                const isCanceled = tx.status === "CANCELED";
                const canRequestCancel = tx.status === "COMPLETED";

                return (
                  <div key={tx.id}>
                    <div className="flex items-center justify-between px-4 py-4 gap-3">
                      {/* Left: time + order id */}
                      <div className="flex flex-col gap-0.5 min-w-[68px]">
                        <span className="text-xs text-slate-400 tabular-nums">
                          {formatTime(tx.created_at)}
                        </span>
                        <span
                          className={`text-sm font-bold ${isCanceled ? "text-slate-300 line-through" : "text-on-surface"}`}
                        >
                          {formatOrderId(tx.id)}
                        </span>
                      </div>

                      {/* Middle: customer name + status badge */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm truncate ${isCanceled ? "text-slate-300" : "text-on-surface"}`}
                        >
                          {tx.customer_name || "Pelanggan Umum"}
                        </p>
                        {statusBadge && (
                          <span
                            className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge.className}`}
                          >
                            <statusBadge.Icon size={9} />
                            {statusBadge.label}
                          </span>
                        )}
                      </div>

                      {/* Right: badge + price + action button */}
                      <div className="flex items-center gap-4">
                        {/* Price Details */}
                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
                          >
                            <BadgeIcon size={10} />
                            {badge.label}
                          </span>
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{
                              color: isCanceled ? "#cbd5e1" : "#10b981",
                            }}
                          >
                            {formatRupiah(tx.total_amount)}
                          </span>
                        </div>

                        {/* Request Cancel Button (only for COMPLETED) */}
                        <button
                          onClick={() => handleRequestCancel(tx)}
                          disabled={!canRequestCancel || cancellingId === tx.id}
                          className={`p-2 -mr-2 rounded-lg transition-all duration-200 ${canRequestCancel
                              ? "text-slate-300 hover:bg-red-50 hover:text-red-600"
                              : "text-slate-100 cursor-not-allowed"
                            }`}
                          title={
                            canRequestCancel
                              ? "Request to Cancel"
                              : "Tidak dapat dibatalkan"
                          }
                        >
                          {cancellingId === tx.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-300" />
                          ) : (
                            <X size={18} strokeWidth={2.5} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Divider (except after last item) */}
                    {i < transactions.length - 1 && (
                      <div className="border-t border-outline/5 mx-4" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
