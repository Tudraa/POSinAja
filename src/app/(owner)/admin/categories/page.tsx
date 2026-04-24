"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search, Plus, Edit2, Trash2, Tag, X } from "lucide-react";
import {
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/actions/product_category";

const PRESET_COLORS = [
  "#f97316", // Orange (Default)
  "#10b981", // Emerald
  "#0ea5e9", // Sky Blue
  "#f43f5e", // Rose
  "#8b5cf6", // Violet
  "#64748b", // Slate
];

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setCategories(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await addCategory({ name, color });
    if (result.success) {
      setName("");
      setColor(PRESET_COLORS[0]);
      setIsAddModalOpen(false);
      fetchData();
    } else {
      alert("Gagal: " + result.message);
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateCategory(editId, {
      name: editName,
      color: editColor,
    });
    if (result.success) {
      setIsEditModalOpen(false);
      fetchData();
    } else {
      alert("Gagal memperbarui: " + result.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, catName: string) => {
    if (
      !confirm(
        `Hapus kategori "${catName}"? Semua produk di dalamnya juga akan terhapus.`,
      )
    )
      return;
    setLoading(true);
    const result = await deleteCategory(id);
    if (result.success) fetchData();
    setLoading(false);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end py-6">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">
            Master Categories
          </h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Kelola kategori global untuk produk Anda.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hero-gradient text-on-primary px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 ambient-shadow active:scale-95 transition-transform"
        >
          <Plus size={20} /> Tambah Kategori
        </button>
      </div>

      {/* Data Container */}
      <div className="bg-surface-container-lowest rounded-2xl ambient-shadow overflow-hidden ghost-border">
        {/* Control Bar */}
        <div className="p-6 border-b border-surface-container-low flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body text-sm text-on-surface"
            />
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant/60 text-xs font-bold uppercase tracking-widest border-b border-surface-container-low">
              <th className="px-8 py-4">Nama Kategori</th>
              <th className="px-8 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {filteredCategories.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-8 py-12 text-center text-on-surface-variant"
                >
                  <Tag size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Belum ada kategori.</p>
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat) => (
                <tr
                  key={cat.id}
                  className="hover:bg-surface-container-low/50 transition-colors group"
                >
                  <td className="px-8 py-5 flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: `${cat.color || PRESET_COLORS[0]}20`,
                        color: cat.color || PRESET_COLORS[0],
                      }}
                    >
                      <Tag size={16} />
                    </div>
                    <span className="font-bold text-on-surface font-headline">{cat.name}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditId(cat.id);
                          setEditName(cat.name);
                          setEditColor(cat.color || PRESET_COLORS[0]);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 text-primary"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={loading}
                        className="p-2 text-error disabled:opacity-50"
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

      {/* --- MODAL TAMBAH --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-md ambient-shadow relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-6 top-6 text-on-surface-variant hover:text-on-surface"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-6">
              Tambah Kategori
            </h2>
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none text-on-surface focus:ring-2 focus:ring-primary/20"
                  placeholder="Contoh: Makanan Berat"
                />
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-3">
                  Warna Kategori
                </label>
                <div className="flex gap-3 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-full border-4 transition-all shadow-sm ${color === c
                        ? "border-on-surface scale-110"
                        : "border-transparent hover:scale-105"
                        }`}
                      style={{ backgroundColor: c }}
                      title={`Pilih warna ${c}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 hero-gradient text-on-primary rounded-xl font-bold disabled:opacity-50 transition-all ambient-shadow"
              >
                {loading ? "Menyimpan..." : "Simpan Kategori"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-md ambient-shadow relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-6 top-6 text-on-surface-variant hover:text-on-surface"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-6">
              Edit Kategori
            </h2>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none text-on-surface focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-3">
                  Warna Kategori
                </label>
                <div className="flex gap-3 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-10 h-10 rounded-full border-4 transition-all shadow-sm ${editColor === c
                        ? "border-on-surface scale-110"
                        : "border-transparent hover:scale-105"
                        }`}
                      style={{ backgroundColor: c }}
                      title={`Pilih warna ${c}`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 hero-gradient text-on-primary rounded-xl font-bold disabled:opacity-50 transition-all ambient-shadow"
              >
                {loading ? "Memperbarui..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
