"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  Image as ImageIcon,
  X,
  CalendarDays,
} from "lucide-react";
import { addProduct, updateProduct, deleteProduct } from "@/actions/product";
import { formatRupiah } from "@/utils/format";

export default function ProductManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 🔥 FITUR BARU: State untuk filter event yang aktif
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>("ALL");

  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    image_url: "",
    category_id: "",
    event_id: "",
    is_available: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: prodData } = await supabase
      .from("products")
      .select("*, categories(name, color), events(name)")
      .order("created_at", { ascending: false });

    const { data: catData } = await supabase
      .from("categories")
      .select("id, name");

    // Ambil SEMUA event (bahkan yang non-aktif) agar produk lama tetap bisa difilter
    const { data: eventData } = await supabase
      .from("events")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (prodData) setProducts(prodData);
    if (catData) setCategories(catData);
    if (eventData) setEvents(eventData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = editMode
      ? await updateProduct(currentId, formData)
      : await addProduct(formData);

    if (result.success) {
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } else {
      alert("Error: " + result.message);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: 0,
      image_url: "",
      category_id: "",
      event_id: "",
      is_available: true,
    });
    setEditMode(false);
    setCurrentId("");
  };

  const openEdit = (prod: any) => {
    setFormData({
      name: prod.name,
      price: prod.price,
      image_url: prod.image_url || "",
      category_id: prod.category_id,
      event_id: prod.event_id,
      is_available: prod.is_available,
    });
    setCurrentId(prod.id);
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    const result = await deleteProduct(id);
    if (result.success) fetchData();
  };

  // 🔥 FITUR BARU: Logika penyaringan ganda (Pencarian Teks + Filter Event)
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchEvent =
      selectedEventFilter === "ALL" || p.event_id === selectedEventFilter;
    return matchSearch && matchEvent;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end py-6">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">
            Master Products
          </h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Kelola katalog menu dan inventaris Anda.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="hero-gradient text-on-primary px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 ambient-shadow active:scale-95 transition-transform"
        >
          <Plus size={20} /> Tambah Produk
        </button>
      </div>

      {/* Data Container */}
      <div className="bg-surface-container-lowest rounded-2xl ambient-shadow overflow-hidden ghost-border">
        {/* Control Area */}
        <div className="p-6 border-b border-surface-container-low space-y-4">
          {/* Search */}
          <div className="relative max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari nama produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body text-sm text-on-surface"
            />
          </div>

          {/* Event Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar p-1">
            <CalendarDays
              size={18}
              className="text-on-surface-variant mr-2 flex-shrink-0"
            />

            <button
              onClick={() => setSelectedEventFilter("ALL")}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedEventFilter === "ALL"
                  ? "bg-on-surface text-on-primary shadow-md"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container"
                }`}
            >
              Semua Menu
            </button>

            {events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEventFilter(ev.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedEventFilter === ev.id
                    ? "bg-orange-50 text-primary-container ring-1 ring-primary-container shadow-sm border-transparent"
                    : "bg-surface-container-lowest border-surface-container text-on-surface-variant hover:border-primary-container/30 hover:bg-orange-50/50"
                  }`}
              >
                {ev.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant/60 text-xs font-bold uppercase tracking-widest border-b border-surface-container-low">
                <th className="px-8 py-4">Produk</th>
                <th className="px-8 py-4">Kategori</th>
                <th className="px-8 py-4 text-center">Harga</th>
                <th className="px-8 py-4 text-center">Status</th>
                <th className="px-8 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-8 py-16 text-center text-on-surface-variant"
                  >
                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-semibold text-on-surface">
                      Tidak ada produk ditemukan.
                    </p>
                    <p className="text-sm">
                      Coba ganti filter event atau ubah kata kunci pencarian.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-surface-container-low/50 transition-colors group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-surface-container-low overflow-hidden border border-surface-container flex-shrink-0">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-on-surface-variant/30">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-on-surface text-sm font-headline">
                            {prod.name}
                          </p>
                          <p className="text-[10px] text-on-surface-variant font-medium tracking-tighter uppercase mt-0.5">
                            📍 {prod.events?.name || "Tanpa Event"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center"
                        style={{
                          backgroundColor: `${prod.categories?.color || "#ccc"}15`,
                          color: prod.categories?.color || "#666",
                        }}
                      >
                        {prod.categories?.name || "Tanpa Kategori"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-on-surface text-sm font-headline">
                      {formatRupiah(prod.price)}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${prod.is_available
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-red-50 text-red-600 border-red-100"
                          }`}
                      >
                        {prod.is_available ? "READY" : "EMPTY"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(prod)}
                          className="p-2 text-on-surface-variant/50 hover:text-primary transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="p-2 text-on-surface-variant/50 hover:text-error transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL PRODUK --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-lg ambient-shadow relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-6 top-6 text-on-surface-variant hover:text-on-surface"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-6">
              {editMode ? "Edit Produk" : "Tambah Produk Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                    placeholder="Nasi Goreng Spesial"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                    Status Stok
                  </label>
                  <select
                    value={formData.is_available ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_available: e.target.value === "true",
                      })
                    }
                    className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none text-on-surface font-bold focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="true">Tersedia (Ready)</option>
                    <option value="false">Habis (Empty)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                    Kategori Global
                  </label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none text-on-surface focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                    Masuk Event Mana?
                  </label>
                  <select
                    required
                    value={formData.event_id}
                    onChange={(e) =>
                      setFormData({ ...formData, event_id: e.target.value })
                    }
                    className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none text-on-surface focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">-- Pilih Event --</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                    URL Gambar (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                    placeholder="https://image-link.com/photo.jpg"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 hero-gradient text-on-primary rounded-xl font-bold disabled:opacity-50 transition-all ambient-shadow"
              >
                {loading
                  ? "Memproses..."
                  : editMode
                    ? "Simpan Perubahan"
                    : "Simpan Produk"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
