"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Parameter saya ubah namanya jadi profileId agar konsisten
export async function checkOrOpenShift(profileId: string) {
  try {
    const { data: existingShift, error: checkError } = await supabaseAdmin
      .from("shifts")
      .select("id")
      .eq("profile_id", profileId) // <-- UBAH DI SINI
      .eq("status", "OPEN")
      .maybeSingle();

    if (checkError) throw checkError;

    // Jika shift sudah ada, kembalikan ID-nya
    if (existingShift) {
      return { success: true, shiftId: existingShift.id };
    }

    // Jika tidak ada, barulah kita buat shift baru
    const { data: newShift, error: insertError } = await supabaseAdmin
      .from("shifts")
      .insert({ profile_id: profileId, status: "OPEN" }) // <-- UBAH DI SINI
      .select("id")
      .single();

    if (insertError) throw insertError;

    return { success: true, shiftId: newShift.id };
  } catch (error: any) {
    console.error("Gagal membuka shift:", error.message);
    return { success: false, message: error.message };
  }
}

export async function endShift(shiftId: string) {
  try {
    const { error } = await supabaseAdmin
      .from("shifts")
      .update({
        status: "CLOSED",
        end_time: new Date().toISOString(),
      })
      .eq("id", shiftId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
