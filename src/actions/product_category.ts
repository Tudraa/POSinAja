"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { verifyOwnerAccess } from "./auth-guard";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// src/actions/category.ts

export async function addCategory(data: { name: string; color: string }) {
  try {
    await verifyOwnerAccess(); //

    const { error } = await supabaseAdmin.from("categories").insert({
      name: data.name,
      color: data.color, // Simpan warna ke database
    });

    if (error) throw error;
    revalidatePath("/admin/categories");
    return { success: true, message: "Kategori berhasil ditambahkan!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateCategory(
  id: string,
  data: { name: string; color: string },
) {
  try {
    await verifyOwnerAccess(); //
    const { error } = await supabaseAdmin
      .from("categories")
      .update({
        name: data.name,
        color: data.color,
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/admin/categories");
    return { success: true, message: "Kategori berhasil diperbarui!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteCategory(id: string) {
  try {
    await verifyOwnerAccess(); //

    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/categories");
    return { success: true, message: "Kategori berhasil dihapus!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
