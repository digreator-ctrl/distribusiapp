import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save } from "lucide-react";
import type { Role, Permission, RolePermissions } from "./store";
import {
  PermissionMatrix, Toast,
  loadRoles, saveRoles, createEmptyPermissions, togglePermission, setAllPermissions,
} from "./store";

export const RbacCreate = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<RolePermissions>(createEmptyPermissions());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleToggle = (moduleId: string, action: keyof Permission) =>
    setPermissions((p) => togglePermission(p, moduleId, action));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const roles = loadRoles();
    if (roles.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      setToast({ message: "Nama role sudah digunakan.", type: "error" });
      return;
    }

    const newRole: Role = {
      id: Date.now(),
      name: trimmed,
      description: description.trim(),
      status: "Custom",
      color: "purple",
      permissions,
    };
    saveRoles([...roles, newRole]);
    setToast({ message: "Role baru berhasil ditambahkan.", type: "success" });
    setTimeout(() => navigate(`/rbac/${newRole.id}`), 1000);
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <button
            type="button"
            onClick={() => navigate("/rbac")}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold hover:bg-muted transition mb-3 shadow-sm"
          >
            ← Kembali ke Daftar Role
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Tambah Role Baru</h1>
          <p className="text-muted-foreground mt-1">Buat role baru dan tentukan hak akses awal untuk setiap modul.</p>
        </div>

        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">Informasi Role</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="role-name" className="text-sm font-semibold">Nama Role <span className="text-red-500">*</span></label>
              <input
                id="role-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="cth: Supervisor Gudang"
                required
              />
            </div>
            <div>
              <label htmlFor="role-desc" className="text-sm font-semibold">Deskripsi</label>
              <input
                id="role-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="Keterangan singkat tugas role ini"
              />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b pb-3">
            <div>
              <h2 className="text-lg font-bold">Hak Akses Modul</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Centang Buat/Ubah/Hapus otomatis mengaktifkan Lihat.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPermissions(setAllPermissions(true))} className="px-3 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted transition">
                Pilih Semua
              </button>
              <button type="button" onClick={() => setPermissions(setAllPermissions(false))} className="px-3 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted transition">
                Kosongkan
              </button>
            </div>
          </div>
          <PermissionMatrix permissions={permissions} editable onToggle={handleToggle} />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate("/rbac")} className="px-5 py-2.5 border rounded-xl font-bold text-sm hover:bg-muted">
            Batal
          </button>
          <button id="btn-save-role" type="submit" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow hover:opacity-90 flex items-center gap-2">
            <Save className="w-4 h-4" /> Simpan Role
          </button>
        </div>
      </form>
    </>
  );
};
