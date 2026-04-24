"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    Receipt,
    CheckCircle2,
    XCircle,
    Clock,
    Banknote,
    QrCode,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";
import { approveCancelRequest, rejectCancelRequest } from "@/actions/transaction";

// ─── Supabase client (stable singleton, outside component) ────────────────────
const supabase = createClient();

// ─── Constants ────────────────────────────────────────────────────────────────
const PENDING_PER_PAGE = 5;
const HISTORY_PER_PAGE = 10;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatOrderId(id: string): string {
    return "#" + id.slice(0, 8).toUpperCase();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TransactionStatus = "COMPLETED" | "CANCEL_REQUEST" | "CANCELED" | "CANCELED_REJECTED";
type PaymentMethod = "CASH" | "QRIS" | "DEBIT";

type Transaction = {
    id: string;
    created_at: string;
    customer_name: string;
    shifts: { profiles: { name: string } | null } | null;
    payment_method: PaymentMethod;
    total_amount: number;
    status: TransactionStatus;
    cancel_reason: string | null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PaymentBadge({ method }: { method: PaymentMethod }) {
    const config = {
        CASH: { Icon: Banknote, label: "Cash", className: "bg-emerald-50 text-emerald-600" },
        QRIS: { Icon: QrCode, label: "QRIS", className: "bg-blue-50 text-blue-500" },
        DEBIT: { Icon: CreditCard, label: "Debit", className: "bg-purple-50 text-purple-600" },
    }[method];
    const { Icon, label, className } = config;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${className}`}>
            <Icon size={10} />
            {label}
        </span>
    );
}

function StatusBadge({ status }: { status: TransactionStatus }) {
    const config: Record<TransactionStatus, { label: string; className: string }> = {
        COMPLETED: { label: "Completed", className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
        CANCEL_REQUEST: { label: "Cancel Request", className: "bg-amber-50 text-amber-600 border border-amber-200" },
        CANCELED: { label: "Canceled", className: "bg-slate-100 text-slate-400 border border-slate-200" },
        CANCELED_REJECTED: { label: "Cancel Rejected", className: "bg-red-50 text-red-500 border border-red-200" },
    };
    const { label, className } = config[status];
    return (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
            {label}
        </span>
    );
}

function Pagination({ currentPage, totalPages, onPrev, onNext, isLoading }: {
    currentPage: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
    isLoading?: boolean;
}) {
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-container-low">
            <span className="text-xs text-on-surface-variant">
                Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-2">
                <button
                    onClick={onPrev}
                    disabled={currentPage === 1 || isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant border border-surface-container hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={14} /> Prev
                </button>
                <button
                    onClick={onNext}
                    disabled={currentPage === totalPages || isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant border border-surface-container hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    Next <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransactionManagement() {
    // ── State ──────────────────────────────────────────────────────────────────
    const [pendingRequests, setPendingRequests] = useState<Transaction[]>([]);
    const [historyTransactions, setHistoryTransactions] = useState<Transaction[]>([]);
    const [pendingTotalCount, setPendingTotalCount] = useState(0);
    const [historyTotalCount, setHistoryTotalCount] = useState(0);
    const [isPendingLoading, setIsPendingLoading] = useState(true);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // ── Pagination State ───────────────────────────────────────────────────────
    const [pendingPage, setPendingPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);

    const pendingTotalPages = Math.max(1, Math.ceil(pendingTotalCount / PENDING_PER_PAGE));
    const historyTotalPages = Math.max(1, Math.ceil(historyTotalCount / HISTORY_PER_PAGE));

    // ── Data Fetching ──────────────────────────────────────────────────────────
    // Accept an explicit page override so we can call at page=1 right after reset
    const fetchPending = useCallback(async (pageOverride?: number) => {
        const page = pageOverride ?? pendingPage;
        setIsPendingLoading(true);
        try {
            const from = (page - 1) * PENDING_PER_PAGE;
            const to = from + PENDING_PER_PAGE - 1;

            const { data, error, count } = await supabase
                .from("transactions")
                .select(
                    "id, created_at, customer_name, shifts(profiles(name)), payment_method, total_amount, status, cancel_reason",
                    { count: "exact" },
                )
                .eq("status", "CANCEL_REQUEST")
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;

            setPendingRequests((data ?? []) as unknown as Transaction[]);
            if (count !== null) setPendingTotalCount(count);
        } catch (err: any) {
            console.error("fetchPending error:", err.message);
        } finally {
            setIsPendingLoading(false);
        }
    }, [pendingPage]); // supabase is stable (module-level), so safe to omit

    const fetchHistory = useCallback(async (pageOverride?: number) => {
        const page = pageOverride ?? historyPage;
        setIsHistoryLoading(true);
        try {
            const from = (page - 1) * HISTORY_PER_PAGE;
            const to = from + HISTORY_PER_PAGE - 1;

            const { data, error, count } = await supabase
                .from("transactions")
                .select(
                    "id, created_at, customer_name, shifts(profiles(name)), payment_method, total_amount, status, cancel_reason",
                    { count: "exact" },
                )
                .neq("status", "CANCEL_REQUEST")
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;

            setHistoryTransactions((data ?? []) as unknown as Transaction[]);
            if (count !== null) setHistoryTotalCount(count);
        } catch (err: any) {
            console.error("fetchHistory error:", err.message);
        } finally {
            setIsHistoryLoading(false);
        }
    }, [historyPage]);

    // Run fetch whenever page changes
    useEffect(() => { fetchPending(); }, [fetchPending]);
    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    // ── Action Handlers ────────────────────────────────────────────────────────
    const handleApprove = async (tx: Transaction) => {
        const confirmed = window.confirm(
            `Setujui pembatalan untuk ${formatOrderId(tx.id)} (${tx.customer_name})?\n\nAlasan: "${tx.cancel_reason}"\n\nUang akan dikembalikan ke pelanggan dan omzet akan dikurangi.`,
        );
        if (!confirmed) return;

        setActionLoading(tx.id);
        const result = await approveCancelRequest(tx.id);
        if (!result.success) alert("Gagal menyetujui: " + result.message);
        setActionLoading(null);

        // Reset both to page 1 and fetch with explicit page=1 (avoids stale closure)
        setPendingPage(1);
        setHistoryPage(1);
        await Promise.all([fetchPending(1), fetchHistory(1)]);
    };

    const handleReject = async (tx: Transaction) => {
        const confirmed = window.confirm(
            `Tolak permintaan pembatalan ${formatOrderId(tx.id)} (${tx.customer_name})?\n\nAlasan kasir: "${tx.cancel_reason}"\n\nTransaksi akan tetap dihitung sebagai omzet sah.`,
        );
        if (!confirmed) return;

        setActionLoading(tx.id);
        const result = await rejectCancelRequest(tx.id);
        if (!result.success) alert("Gagal menolak: " + result.message);
        setActionLoading(null);

        setPendingPage(1);
        setHistoryPage(1);
        await Promise.all([fetchPending(1), fetchHistory(1)]);
    };

    // ── Initial loading skeleton ───────────────────────────────────────────────
    const isInitialLoading =
        isPendingLoading && pendingRequests.length === 0 &&
        isHistoryLoading && historyTransactions.length === 0;

    if (isInitialLoading) {
        return (
            <div className="space-y-8 py-6">
                <div>
                    <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">
                        Manajemen Transaksi
                    </h2>
                    <p className="text-on-surface-variant font-medium mt-1">
                        Kelola permintaan pembatalan dan lihat riwayat transaksi harian.
                    </p>
                </div>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 py-6">
            {/* ── Page Header ── */}
            <div>
                <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">
                    Manajemen Transaksi
                </h2>
                <p className="text-on-surface-variant font-medium mt-1">
                    Kelola permintaan pembatalan dan lihat riwayat transaksi harian.
                </p>
            </div>

            {/* ══ SECTION 1 — PENDING CANCELLATIONS ══ */}
            <div className={`bg-surface-container-lowest rounded-2xl ambient-shadow overflow-hidden ghost-border transition-opacity ${isPendingLoading ? "opacity-60" : "opacity-100"}`}>
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-amber-100 bg-amber-50/60">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-600">
                        <AlertTriangle size={18} strokeWidth={2.5} />
                    </span>
                    <div>
                        <h3 className="font-headline font-bold text-base text-amber-800 leading-tight">
                            Menunggu Persetujuan Pembatalan
                        </h3>
                        <p className="text-xs text-amber-600 mt-0.5">
                            {pendingTotalCount} permintaan menunggu keputusan Anda
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-container-low text-on-surface-variant/60 text-xs font-bold uppercase tracking-widest border-b border-surface-container-low">
                                <th className="px-6 py-4">Waktu</th>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Pelanggan</th>
                                <th className="px-6 py-4">Kasir</th>
                                <th className="px-6 py-4">Alasan Pembatalan</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-low">
                            {pendingRequests.length === 0 && !isPendingLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-[22px] text-center text-on-surface-variant" style={{ height: `${PENDING_PER_PAGE * 57}px` }}>
                                        <div className="flex flex-col items-center justify-center h-full gap-2">
                                            <Clock size={40} className="opacity-20" />
                                            <p className="font-medium">Tidak ada permintaan pembatalan saat ini.</p>
                                            <p className="text-xs text-on-surface-variant/60">Semua transaksi berjalan normal.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {pendingRequests.map((tx) => {
                                        const isActioning = actionLoading === tx.id;
                                        return (
                                            <tr key={tx.id} className="hover:bg-amber-50/30 transition-colors">
                                                <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                                                    {formatTime(tx.created_at)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-sm text-on-surface font-mono">
                                                        {formatOrderId(tx.id)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-on-surface-variant">{tx.shifts?.profiles?.name || "—"}</td>
                                                <td className="px-6 py-4 text-sm text-on-surface">{tx.customer_name || "Pelanggan Umum"}</td>
                                                <td className="px-6 py-4 max-w-[240px]">
                                                    <p className="text-sm text-on-surface-variant italic truncate">
                                                        &ldquo;{tx.cancel_reason}&rdquo;
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-sm text-on-surface tabular-nums">
                                                        {formatRupiah(tx.total_amount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleApprove(tx)}
                                                            disabled={isActioning}
                                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {isActioning ? (
                                                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-emerald-600" />
                                                            ) : (
                                                                <CheckCircle2 size={14} />
                                                            )}
                                                            Setuju
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(tx)}
                                                            disabled={isActioning}
                                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {isActioning ? (
                                                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-500" />
                                                            ) : (
                                                                <XCircle size={14} />
                                                            )}
                                                            Tolak
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Filler rows — keep card height fixed */}
                                    {Array.from({ length: Math.max(0, PENDING_PER_PAGE - pendingRequests.length) }).map((_, i) => (
                                        <tr key={`filler-p-${i}`} aria-hidden="true">
                                            <td colSpan={7} className="px-6 py-[22px]" />
                                        </tr>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={pendingPage}
                    totalPages={pendingTotalPages}
                    isLoading={isPendingLoading}
                    onPrev={() => setPendingPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPendingPage((p) => Math.min(pendingTotalPages, p + 1))}
                />
            </div>

            {/* ══ SECTION 2 — ALL TRANSACTIONS HISTORY ══ */}
            <div className={`bg-surface-container-lowest rounded-2xl ambient-shadow overflow-hidden ghost-border transition-opacity ${isHistoryLoading ? "opacity-60" : "opacity-100"}`}>
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-container-low">
                    <span className="p-2 rounded-xl bg-primary-fixed text-primary">
                        <Receipt size={18} strokeWidth={2.5} />
                    </span>
                    <div>
                        <h3 className="font-headline font-bold text-base text-on-surface leading-tight">
                            Riwayat Semua Transaksi
                        </h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                            {historyTotalCount} transaksi tercatat
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-surface-container-low text-on-surface-variant/60 text-xs font-bold uppercase tracking-widest border-b border-surface-container-low">
                                <th className="px-6 py-4">Waktu</th>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Kasir</th>
                                <th className="px-6 py-4">Pelanggan</th>
                                <th className="px-6 py-4">Metode</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container-low">
                            {historyTransactions.length === 0 && !isHistoryLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 text-center text-on-surface-variant" style={{ height: `${HISTORY_PER_PAGE * 57}px` }}>
                                        <div className="flex flex-col items-center justify-center h-full gap-2">
                                            <Receipt size={40} className="opacity-20" />
                                            <p className="font-medium">Belum ada riwayat transaksi.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {historyTransactions.map((tx) => {
                                        const isCanceled = tx.status === "CANCELED";
                                        return (
                                            <tr key={tx.id} className="hover:bg-surface-container-low/50 transition-colors">
                                                <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">
                                                    {formatTime(tx.created_at)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-bold text-sm font-mono ${isCanceled ? "text-slate-300 line-through" : "text-on-surface"}`}>
                                                        {formatOrderId(tx.id)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-on-surface-variant">
                                                    {tx.shifts?.profiles?.name || "—"}
                                                </td>
                                                <td className={`px-6 py-4 text-sm ${isCanceled ? "text-slate-300" : "text-on-surface"}`}>
                                                    {tx.customer_name || "Pelanggan Umum"}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <PaymentBadge method={tx.payment_method} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`font-bold text-sm tabular-nums ${isCanceled ? "text-slate-300 line-through" : "text-on-surface"}`}>
                                                        {formatRupiah(tx.total_amount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <StatusBadge status={tx.status} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* Filler rows — keep card height fixed */}
                                    {Array.from({ length: Math.max(0, HISTORY_PER_PAGE - historyTransactions.length) }).map((_, i) => (
                                        <tr key={`filler-h-${i}`} aria-hidden="true">
                                            <td colSpan={7} className="px-6 py-[22px]" />
                                        </tr>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={historyPage}
                    totalPages={historyTotalPages}
                    isLoading={isHistoryLoading}
                    onPrev={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    onNext={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                />
            </div>
        </div>
    );
}