"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { verifyOwnerAccess } from "./auth-guard";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function addProduct(data: {
  name: string;
  price: number;
  image_url: string;
  category_id: string;
  event_id: string;
}) {
  try {
    await verifyOwnerAccess();
    const { error } = await supabaseAdmin.from("products").insert({
      name: data.name,
      price: data.price,
      image_url: data.image_url,
      category_id: data.category_id,
      event_id: data.event_id,
      is_available: true,
    });

    if (error) throw error;

    revalidatePath("/admin/products");
    return { success: true, message: "Produk berhasil ditambahkan!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    price: number;
    image_url: string;
    category_id: string;
    event_id: string;
    is_available: boolean;
  },
) {
  try {
    await verifyOwnerAccess();
    const { error } = await supabaseAdmin
      .from("products")
      .update({
        name: data.name,
        price: data.price,
        image_url: data.image_url,
        category_id: data.category_id,
        event_id: data.event_id,
        is_available: data.is_available,
      })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/products");
    return { success: true, message: "Produk berhasil diperbarui!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteProduct(id: string) {
  try {
    await verifyOwnerAccess();
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/products");
    return { success: true, message: "Produk berhasil dihapus!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
