"use client";

import { ShoppingCart } from "lucide-react";
import { formatRupiah } from "@/utils/format";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    categories?: {
      name: string;
      color: string;
    };
  };
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  // Mengambil warna dari database, jika tidak ada gunakan warna default orange
  const categoryColor = product.categories?.color || "#f97316";

  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-3xl p-3 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col text-left active:scale-95"
    >
      {/* 1. Label Kategori Berwarna (Badge) */}
      <div className="absolute top-5 left-5 z-10">
        <span
          className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm"
          style={{
            backgroundColor: categoryColor,
            color: "#ffffff",
          }}
        >
          {product.categories?.name || "Umum"}
        </span>
      </div>

      {/* 2. Area Gambar dengan Efek Hover */}
      <div className="aspect-square w-full rounded-2xl overflow-hidden mb-4 bg-slate-50 relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <ShoppingCart size={40} strokeWidth={1} />
          </div>
        )}

        {/* Overlay saat hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </div>

      {/* 3. Detail Produk */}
      <div className="px-1 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-900 leading-tight mb-2 line-clamp-2">
          {product.name}
        </h3>

        <div className="mt-auto flex items-end justify-between">
          <p className="font-black text-lg" style={{ color: categoryColor }}>
            {formatRupiah(product.price)}
          </p>

          {/* Indikator Tambah (+) Kecil */}
          <div
            className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              backgroundColor: `${categoryColor}15`,
              color: categoryColor,
            }}
          >
            <ShoppingCart size={16} />
          </div>
        </div>
      </div>

      {/* 4. Aksen Garis Tipis di bagian atas (Opsional) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 rounded-b-full"
        style={{ backgroundColor: categoryColor }}
      />
    </button>
  );
}
