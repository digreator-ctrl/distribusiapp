import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Pencil, Lock, Trash2 } from "lucide-react";
import { ConfirmModal } from "../../components/ConfirmModal";
import type { Role, Permission, RolePermissions } from "./store";
import {
  PermissionMatrix, Toast, MODULES, COLOR_CLASSES,
  loadRoles, saveRoles, togglePermission, setAllPermissions, countModuleAccess, isProtectedRole,
} from "./store";

export const RbacShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftPerms, setDraftPerms] = useState<RolePermissions>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const found = loadRoles().find((r) => String(r.id) === id) || null;
    setRole(found);
    setLoaded(true);
  }, [id]);

  if (!loaded) return <div className="py-10 text-center animate-pulse">Memuat detail role...</div>;

  if (!role) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 font-bold">Role tidak ditemukan.</p>
        <button onClick={() => navigate("/rbac")} className="mt-4 px-4 py-2 border rounded shadow-sm">Kembali</button>
      </div>
    );
  }

  const locked = isProtectedRole(role);

  const startEdit = () => {
    setDraftName(role.name);
    setDraftDesc(role.description || "");
    setDraftPerms(JSON.parse(JSON.stringify(role.permissions)));
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const handleToggle = (moduleId: string, action: keyof Permission) =>
    setDraftPerms((p) => togglePermission(p, moduleId, action));

  const handleSave = () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setToast({ message: "Nama role wajib diisi.", type: "error" });
      return;
    }
    const roles = loadRoles();
    if (roles.some((r) => r.id !== role.id && r.name.toLowerCase() === trimmed.toLowerCase())) {
      setToast({ message: "Nama role sudah digunakan.", type: "error" });
      return;
    }
    const updated: Role = { ...role, name: trimmed, description: draftDesc.trim(), permissions: draftPerms };
    saveRoles(roles.map((r) => (r.id === role.id ? updated : r)));
    setRole(updated);
    setIsEditing(false);
    setToast({ message: "Pengaturan hak akses berhasil disimpan.", type: "success" });
  };

  const handleDelete = () => {
    saveRoles(loadRoles().filter((r) => r.id !== role.id));
    setShowDeleteConfirm(false);
    setToast({ message: "Role berhasil dihapus.", type: "success" });
    setTimeout(() => navigate("/rbac"), 1000);
  };

  const perms = isEditing ? draftPerms : role.permissions;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Hapus Role Ini?"
        message={`Role ${role.name} akan dihapus permanen beserta pengaturan hak aksesnya.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <button
              onClick={() => navigate("/rbac")}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold hover:bg-muted transition mb-3 shadow-sm"
            >
              ← Kembali ke Daftar Role
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{role.name}</h1>
              <span className={`text-xs px-3 py-1 rounded-full font-bold border uppercase ${COLOR_CLASSES[role.color] || COLOR_CLASSES.purple}`}>
                {role.status}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">Detail role dan hak akses CRUD per modul aplikasi.</p>
          </div>

          <div className="flex gap-2 shrink-0 mt-2 md:mt-0">
            {locked ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border bg-muted text-muted-foreground">
                <Lock className="w-3.5 h-3.5" /> Role sistem (terkunci)
              </span>
            ) : isEditing ? (
              <>
                <button onClick={cancelEdit} className="px-4 py-2 rounded-lg text-xs font-bold border hover:bg-muted transition">
                  Batal
                </button>
                <button id="btn-save-permissions" onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold shadow hover:bg-green-700 transition flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Simpan Perubahan
                </button>
              </>
            ) : (
              <>
                <button id="btn-edit-role" onClick={startEdit} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow hover:bg-primary/90 transition flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Edit Hak Akses
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold shadow hover:bg-red-700 transition flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </>
            )}
          </div>
        </div>

        {/* Informasi Role */}
        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">Informasi Role</h2>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-role-name" className="text-sm font-semibold">Nama Role</label>
                <input id="edit-role-name" value={draftName} onChange={(e) => setDraftName(e.target.value)}
                  className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>
              <div>
                <label htmlFor="edit-role-desc" className="text-sm font-semibold">Deskripsi</label>
                <input id="edit-role-desc" value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)}
                  className="mt-1 w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Nama Role</p>
                <p className="font-bold text-lg mt-0.5">{role.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Deskripsi</p>
                <p className="font-medium mt-0.5">{role.description || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Modul Dapat Diakses</p>
                <p className="font-bold text-lg text-primary mt-0.5">{countModuleAccess(role.permissions)} / {MODULES.length} Modul</p>
              </div>
            </div>
          )}
        </div>

        {/* Matriks Hak Akses */}
        <div className={`bg-card p-6 rounded-2xl border shadow-sm space-y-4 ${isEditing ? "ring-2 ring-primary/40" : ""}`}>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 border-b pb-3">
            <div>
              <h2 className="text-lg font-bold">Hak Akses Modul (CRUD)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditing
                  ? "Mode edit aktif — perubahan baru tersimpan setelah klik \"Simpan Perubahan\"."
                  : "Mode baca saja. Klik \"Edit Hak Akses\" untuk mengubah."}
              </p>
            </div>
            {isEditing && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setDraftPerms(setAllPermissions(true))} className="px-3 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted transition">Pilih Semua</button>
                <button type="button" onClick={() => setDraftPerms(setAllPermissions(false))} className="px-3 py-1.5 border rounded-lg text-xs font-bold hover:bg-muted transition">Kosongkan</button>
              </div>
            )}
          </div>
          <PermissionMatrix permissions={perms} editable={isEditing} onToggle={handleToggle} />
        </div>
      </div>
    </>
  );
};
