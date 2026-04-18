"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { verifyOwnerAccess } from "./auth-guard";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// --- 1. CREATE EVENT ---
export async function addEvent(data: { name: string; description: string }) {
  try {
    await verifyOwnerAccess(); //

    const { error } = await supabaseAdmin.from("events").insert({
      name: data.name,
      description: data.description,
      is_active: true, // Otomatis aktif saat dibuat
    });

    if (error) throw error;

    revalidatePath("/admin/events");
    return { success: true, message: "Event berhasil ditambahkan!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- 2. UPDATE EVENT (Edit Nama/Deskripsi) ---
export async function updateEvent(
  id: string,
  data: { name: string; description: string },
) {
  try {
    await verifyOwnerAccess();
    const { error } = await supabaseAdmin
      .from("events")
      .update({
        name: data.name,
        description: data.description,
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/events");
    return { success: true, message: "Event berhasil diperbarui!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- 3. TOGGLE STATUS (Aktif/Nonaktifkan Event) ---
export async function toggleEventStatus(id: string, currentStatus: boolean) {
  try {
    await verifyOwnerAccess();
    const { error } = await supabaseAdmin
      .from("events")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/events");
    return { success: true, message: "Status event diperbarui!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- 4. DELETE EVENT ---
export async function deleteEvent(id: string) {
  try {
    await verifyOwnerAccess();
    // Berkat 'ON DELETE CASCADE' di SQL, menghapus event di sini
    // akan OTOMATIS menghapus semua kategori dan produk di dalamnya!
    const { error } = await supabaseAdmin.from("events").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/events");
    return {
      success: true,
      message: "Event beserta seluruh isinya berhasil dihapus!",
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
