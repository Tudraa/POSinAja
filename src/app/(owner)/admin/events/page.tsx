"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search, Plus, Edit2, Trash2, Calendar, Power } from "lucide-react";
import {
  addEvent,
  updateEvent,
  toggleEventStatus,
  deleteEvent,
} from "@/actions/event";

export default function EventManagement() {
  const [events, setEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // State Modal Tambah
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // State Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setEvents(data);
  };

  // --- HANDLERS ---
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await addEvent({ name, description });
    if (result.success) {
      setName("");
      setDescription("");
      setIsAddModalOpen(false);
      fetchEvents();
    } else {
      alert("Gagal: " + result.message);
    }
    setLoading(false);
  };

  const openEditModal = (event: any) => {
    setEditId(event.id);
    setEditName(event.name);
    setEditDescription(event.description || "");
    setIsEditModalOpen(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateEvent(editId, {
      name: editName,
      description: editDescription,
    });
    if (result.success) {
      setIsEditModalOpen(false);
      fetchEvents();
    } else {
      alert("Gagal memperbarui: " + result.message);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    const result = await toggleEventStatus(id, currentStatus);
    if (result.success) fetchEvents();
    setLoading(false);
  };

  const handleDeleteEvent = async (id: string, eventName: string) => {
    const confirmed = confirm(
      `PERINGATAN TINGKAT TINGGI!\n\nMenghapus Event "${eventName}" akan MENGHAPUS SEMUA KATEGORI DAN PRODUK di dalamnya.\n\nLanjutkan?`,
    );
    if (!confirmed) return;

    setLoading(true);
    const result = await deleteEvent(id);
    if (result.success) {
      fetchEvents();
    } else {
      alert("Gagal menghapus: " + result.message);
    }
    setLoading(false);
  };

  const filteredEvents = events.filter((ev) =>
    ev.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex justify-between items-end py-6">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">
            Event Management
          </h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Kelola daftar acara, cabang, atau bazaar aktif Anda.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hero-gradient text-on-primary px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 ambient-shadow active:scale-95 transition-transform"
        >
          <Plus size={20} /> Buat Event Baru
        </button>
      </div>

      {/* Data Container */}
      <div className="bg-surface-container-lowest rounded-2xl ambient-shadow overflow-hidden ghost-border">
        {/* Search Bar */}
        <div className="p-6 border-b border-surface-container-low flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-surface-container rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body text-sm text-on-surface"
            />
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant/60 text-xs font-bold uppercase tracking-widest border-b border-surface-container-low">
              <th className="px-8 py-4">Detail Event</th>
              <th className="px-8 py-4 text-center">Status</th>
              <th className="px-8 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {filteredEvents.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-8 py-12 text-center text-on-surface-variant"
                >
                  <Calendar size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Belum ada event yang didaftarkan.</p>
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => (
                <tr
                  key={ev.id}
                  className="hover:bg-surface-container-low/50 transition-colors group"
                >
                  <td className="px-8 py-5">
                    <p className="font-bold text-on-surface font-headline">{ev.name}</p>
                    <p className="text-xs text-on-surface-variant line-clamp-1 max-w-md">
                      {ev.description || "Tidak ada deskripsi"}
                    </p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button
                      onClick={() => handleToggleStatus(ev.id, ev.is_active)}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest inline-flex items-center gap-1.5 transition-colors border ${ev.is_active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                        : "bg-surface-container-high text-on-surface-variant border-surface-container hover:bg-surface-container"
                        }`}
                    >
                      <Power size={10} />
                      {ev.is_active ? "AKTIF" : "NONAKTIF"}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(ev)}
                        className="p-2 text-primary"
                        title="Edit Event"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.name)}
                        disabled={loading}
                        className="p-2 text-error disabled:opacity-50"
                        title="Hapus Event"
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

      {/* --- MODAL TAMBAH EVENT --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-md ambient-shadow relative">
            <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-6">
              Buat Event Baru
            </h2>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                  Nama Event
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  placeholder="Contoh: Bazaar ITS 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] text-on-surface"
                  placeholder="Informasi tambahan mengenai event ini..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 text-on-surface-variant font-bold hover:bg-surface-container-low rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 hero-gradient text-on-primary rounded-xl font-bold transition-all disabled:opacity-50 ambient-shadow"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT EVENT --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-md ambient-shadow relative">
            <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-6">
              Edit Event
            </h2>
            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                  Nama Event
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-3 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] text-on-surface"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 text-on-surface-variant font-bold hover:bg-surface-container-low rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 hero-gradient text-on-primary rounded-xl font-bold transition-all disabled:opacity-50 ambient-shadow"
                >
                  {loading ? "Memperbarui..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
