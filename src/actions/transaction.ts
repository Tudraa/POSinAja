"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

export type TransactionStatus =
    | "COMPLETED"
    | "CANCEL_REQUEST"
    | "CANCELED"
    | "CANCELED_REJECTED";

export type Transaction = {
    id: string;
    created_at: string;
    customer_name: string;
    payment_method: "CASH" | "QRIS" | "DEBIT";
    total_amount: number;
    status: TransactionStatus;
    cancel_reason: string | null;
};

/**
 * Fetch all transactions for the active shift.
 * Revenue logic per status:
 *   COMPLETED       → counted ✅
 *   CANCEL_REQUEST  → counted ✅ (money still in drawer pending owner decision)
 *   CANCELED        → NOT counted ❌
 *   CANCELED_REJECTED → counted ✅
 */
export async function getTransactionsByShift(shiftId: string): Promise<{
    success: boolean;
    data?: Transaction[];
    message?: string;
}> {
    try {
        const { data, error } = await supabaseAdmin
            .from("transactions")
            .select(
                "id, created_at, customer_name, payment_method, total_amount, status, cancel_reason",
            )
            .eq("shift_id", shiftId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return { success: true, data: (data ?? []) as Transaction[] };
    } catch (error: any) {
        console.error("getTransactionsByShift error:", error.message);
        return { success: false, message: error.message };
    }
}

/**
 * Cashier requests a cancellation.
 * The transaction status is set to CANCEL_REQUEST and the reason is saved.
 * Revenue is still COUNTED until the owner approves (CANCELED).
 */
export async function requestCancelTransaction(
    transactionId: string,
    reason: string,
): Promise<{ success: boolean; message?: string }> {
    try {
        const { error } = await supabaseAdmin
            .from("transactions")
            .update({
                status: "CANCEL_REQUEST",
                cancel_reason: reason,
            })
            .eq("id", transactionId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("requestCancelTransaction error:", error.message);
        return { success: false, message: error.message };
    }
}

/**
 * Owner approves the cancellation request.
 * Status → CANCELED. Revenue is removed, stock is eligible for restock.
 */
export async function approveCancelRequest(
    transactionId: string,
): Promise<{ success: boolean; message?: string }> {
    try {
        const { error } = await supabaseAdmin
            .from("transactions")
            .update({ status: "CANCELED" })
            .eq("id", transactionId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("approveCancelRequest error:", error.message);
        return { success: false, message: error.message };
    }
}

/**
 * Owner rejects the cancellation request.
 * Status → CANCELED_REJECTED. Revenue is fully counted. cancel_reason is kept as audit trail.
 */
export async function rejectCancelRequest(
    transactionId: string,
): Promise<{ success: boolean; message?: string }> {
    try {
        const { error } = await supabaseAdmin
            .from("transactions")
            .update({ status: "CANCELED_REJECTED" })
            .eq("id", transactionId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error("rejectCancelRequest error:", error.message);
        return { success: false, message: error.message };
    }
}
