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

export async function addEmployee(data: {
  email: string;
  password: string;
  fullName: string;
}) {
  try {
    await verifyOwnerAccess();

    // 1. Daftarkan email & password ke Brankas Rahasia (Auth)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { name: data.fullName }, // Simpan nama di KTP juga
      });

    if (authError) throw authError;

    // 2. KUNCI JABATAN KE KTP DIGITAL (app_metadata) - Sangat Penting!
    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(
      authData.user.id,
      { app_metadata: { role: "CASHIER" } }, // Default karyawan baru adalah kasir
    );

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw roleError;
    }

    // 3. Catat ID dan Jabatannya ke Papan Pengumuman (Tabel Profiles) untuk UI
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        role: "CASHIER",
        name: data.fullName,
        email: data.email,
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    revalidatePath("/admin/employees");
    return { success: true, message: "Karyawan berhasil ditambahkan" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateEmployee(
  id: string,
  data: { name: string; role: string },
) {
  try {
    await verifyOwnerAccess();

    // 1. UPDATE KTP DIGITAL (app_metadata) - Agar Middleware tahu dia naik jabatan
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      {
        app_metadata: { role: data.role },
        user_metadata: { name: data.name },
      },
    );

    if (authError) throw authError;

    // 2. UPDATE PAPAN PENGUMUMAN (Tabel Profiles) - Agar layar admin berubah
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        name: data.name,
        role: data.role,
      })
      .eq("id", id);

    if (profileError) throw profileError;

    revalidatePath("/admin/employees");
    return { success: true, message: "Profil karyawan berhasil diperbarui!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteEmployee(id: string) {
  try {
    await verifyOwnerAccess();

    // 1. Hapus dari Brankas Rahasia (Auth)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) throw authError;

    // 2. Hapus dari Papan Pengumuman (Tabel Profiles)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) throw profileError;

    revalidatePath("/admin/employees");

    return {
      success: true,
      message: "Karyawan berhasil dihapus total dari sistem!",
    };
  } catch (error: any) {
    console.error("Delete Employee Error:", error.message);
    return { success: false, message: error.message };
  }
}
