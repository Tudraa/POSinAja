"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserPlus, Search, Mail, Shield, X, Edit2, Trash2 } from "lucide-react";
import {
  addEmployee,
  updateEmployee,
  deleteEmployee,
} from "@/actions/employee";

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // State untuk Modal Tambah Karyawan
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // State untuk Modal Edit Karyawan
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("CASHIER");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setEmployees(data);
  };

  // --- FUNGSI TAMBAH ---
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await addEmployee({ email, password, fullName });
    if (result.success) {
      alert("Kasir baru berhasil didaftarkan!");
      setEmail("");
      setPassword("");
      setFullName("");
      setIsAddModalOpen(false);
      fetchEmployees();
    } else {
      alert("Gagal: " + result.message);
    }
    setLoading(false);
  };

  // --- FUNGSI KLIK TOMBOL EDIT ---
  const openEditModal = (emp: any) => {
    setEditId(emp.id);
    setEditName(emp.name || "");
    setEditRole(emp.role || "CASHIER");
    setIsEditModalOpen(true);
  };

  // --- FUNGSI SIMPAN EDIT ---
  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateEmployee(editId, {
      name: editName,
      role: editRole,
    });
    if (result.success) {
      alert("Data berhasil diperbarui!");
      setIsEditModalOpen(false);
      fetchEmployees();
    } else {
      alert("Gagal memperbarui: " + result.message);
    }
    setLoading(false);
  };

  // --- FUNGSI HAPUS KARYAWAN ---
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${name}?`)) {
      return;
    }
    setLoading(true);
    const result = await deleteEmployee(id);
    if (result.success) {
      alert("Karyawan berhasil dihapus!");
      fetchEmployees();
    } else {
      alert("Gagal menghapus: " + result.message);
    }
    setLoading(false);
  };

  const filteredEmployees = employees.filter((emp) => {
    const nameMatch = emp.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const emailMatch = emp.email
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    return nameMatch || emailMatch;
  });

  return (
    <div className="space-y-6 relative">
      {/* Page Header */}
      <div className="flex justify-between items-end py-6">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">
            Team Management
          </h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Manage your staff members and roles.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hero-gradient text-on-primary px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 ambient-shadow active:scale-95 transition-transform"
        >
          <UserPlus size={20} /> Add New Employee
        </button>
      </div>

      {/* Data Container */}
      <div className="bg-surface-container-lowest rounded-2xl ambient-shadow overflow-hidden ghost-border">
        {/* Control Bar */}
        <div className="p-6 flex items-center justify-between border-b border-surface-container-low">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
              size={18}
            />
            <input
              type="text"
              placeholder="Filter by name, email or role..."
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
              <th className="px-8 py-4">Employee</th>
              <th className="px-8 py-4">Role</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {filteredEmployees.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-surface-container-low/50 transition-colors group"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm border ${emp.role === "OWNER"
                        ? "bg-purple-50 text-purple-600 border-purple-100"
                        : "bg-orange-50 text-primary border-orange-100"
                        }`}
                    >
                      {emp.name ? emp.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="font-bold text-on-surface font-headline">
                        {emp.name || "User Tanpa Nama"}
                      </div>
                      <div className="text-xs text-on-surface-variant flex items-center gap-1">
                        <Mail size={12} /> {emp.email || "email@tidak.ada"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span
                    className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider border flex items-center gap-1 w-fit ${emp.role === "OWNER"
                      ? "bg-purple-50 text-purple-600 border-purple-100"
                      : "bg-blue-50 text-blue-600 border-blue-100"
                      }`}
                  >
                    <Shield size={10} /> {emp.role}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Active
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(emp)}
                      className="p-2 text-primary"
                      title="Edit Karyawan"
                    >
                      <Edit2 size={18} />
                    </button>
                    {emp.role !== "OWNER" && (
                      <button
                        onClick={() =>
                          handleDeleteEmployee(emp.id, emp.name || "Karyawan")
                        }
                        disabled={loading}
                        className="p-2 text-error disabled:opacity-50"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL TAMBAH KARYAWAN --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-md ambient-shadow relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-6 top-6 text-on-surface-variant hover:text-on-surface"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-6 flex items-center gap-2">
              <UserPlus size={24} className="text-primary-container" /> Tambah Kasir
            </h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-4 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none text-on-surface focus:ring-2 focus:ring-primary/20"
                placeholder="Nama Lengkap"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none text-on-surface focus:ring-2 focus:ring-primary/20"
                placeholder="Alamat Email"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none text-on-surface focus:ring-2 focus:ring-primary/20"
                placeholder="Password (Min. 6 Karakter)"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 hero-gradient text-on-primary rounded-xl font-bold disabled:opacity-50 transition-all ambient-shadow"
              >
                {loading ? "Menyimpan..." : "Simpan Karyawan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT KARYAWAN --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-md ambient-shadow relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-6 top-6 text-on-surface-variant hover:text-on-surface"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-extrabold font-headline text-on-surface mb-6 flex items-center gap-2">
              <Edit2 size={24} className="text-primary-container" /> Edit Karyawan
            </h2>
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-4 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Jabatan (Role)
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full p-4 bg-surface-container-low border border-surface-container rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 text-on-surface appearance-none font-bold"
                >
                  <option value="CASHIER">🧑‍🍳 CASHIER (Kasir)</option>
                  <option value="OWNER">👑 OWNER (Pemilik)</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 hero-gradient text-on-primary rounded-xl font-bold transition-all disabled:opacity-50 ambient-shadow"
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
