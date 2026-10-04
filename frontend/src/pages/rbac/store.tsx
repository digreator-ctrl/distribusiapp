import { useEffect } from "react";
import { Check, X } from "lucide-react";

export type Permission = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type RolePermissions = Record<string, Permission>;

export type Role = {
  id: number;
  name: string;
  description?: string;
  status: string;
  color: string;
  permissions: RolePermissions;
};

export const STORAGE_KEY = "custom_roles_advanced";

export type ModuleAction = keyof Permission;

export const MODULES: { id: string; label: string; actions: ModuleAction[] }[] = [
  { id: "dashboard", label: "Dashboard", actions: ["read"] },
  { id: "products", label: "Katalog Produk", actions: ["read", "create", "update", "delete"] },
  { id: "inbound", label: "Stok Masuk (Inbound)", actions: ["read", "create", "update", "delete"] },
  { id: "stock_requests", label: "Pengajuan & Rekomendasi Stok", actions: ["read", "create", "update", "delete"] },
  { id: "suppliers", label: "Supplier", actions: ["read", "create", "update", "delete"] },
  { id: "users", label: "Karyawan", actions: ["read", "create", "update", "delete"] },
  { id: "rbac", label: "Manajemen RBAC", actions: ["read", "create", "update", "delete"] },
];

export const ACTIONS: { key: keyof Permission; label: string }[] = [
  { key: "read", label: "Lihat (Read)" },
  { key: "create", label: "Buat (Create)" },
  { key: "update", label: "Ubah (Update)" },
  { key: "delete", label: "Hapus (Delete)" },
];

// Kelas Tailwind statis (kelas dinamis seperti `bg-${color}-100` tidak ter-generate)
export const COLOR_CLASSES: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
};

export const createEmptyPermissions = (): RolePermissions =>
  MODULES.reduce((acc, mod) => {
    acc[mod.id] = { read: false, create: false, update: false, delete: false };
    return acc;
  }, {} as RolePermissions);

export const DEFAULT_ROLES: Role[] = [
  {
    id: 1,
    name: "Owner / Eksekutif",
    description: "Akses penuh ke seluruh modul aplikasi.",
    status: "Full Access",
    color: "green",
    permissions: MODULES.reduce(
      (acc, mod) => ({ ...acc, [mod.id]: { read: true, create: true, update: true, delete: true } }),
      {} as RolePermissions
    ),
  },
  {
    id: 2,
    name: "Admin Gudang",
    description: "Mengelola produk, stok masuk, dan supplier.",
    status: "Restricted",
    color: "blue",
    permissions: {
      ...createEmptyPermissions(),
      dashboard: { read: true, create: false, update: false, delete: false },
      products: { read: true, create: true, update: true, delete: false },
      inbound: { read: true, create: true, update: false, delete: false },
      suppliers: { read: true, create: true, update: true, delete: false },
      stock_requests: { read: true, create: true, update: true, delete: true },
    },
  },
  {
    id: 3,
    name: "Sales Lapangan",
    description: "Akses terbatas untuk operasional lapangan.",
    status: "Restricted",
    color: "purple",
    permissions: {
      ...createEmptyPermissions(),
      dashboard: { read: true, create: false, update: false, delete: false },
      products: { read: true, create: false, update: false, delete: false },
      stock_requests: { read: true, create: true, update: true, delete: true },
    },
  },
];

/** Role bawaan Owner tidak boleh diubah/dihapus agar tidak terkunci dari sistem */
export const isProtectedRole = (role: Role) => role.id === 1;

export const loadRoles = (): Role[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return DEFAULT_ROLES;
  try {
    const parsed: Role[] = JSON.parse(saved);
    // Pastikan modul baru tetap memiliki entri permission
    let roles = parsed.map((r) => ({ ...r, permissions: { ...createEmptyPermissions(), ...r.permissions } }));
    
    // Auto-inject Sales Lapangan jika belum ada (id: 3)
    if (!roles.some(r => r.id === 3 || r.name === "Sales Lapangan")) {
      const salesRole = DEFAULT_ROLES.find(r => r.id === 3);
      if (salesRole) roles.push(salesRole);
      saveRoles(roles);
    }
    
    return roles;
  } catch {
    return DEFAULT_ROLES;
  }
};

export const saveRoles = (roles: Role[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
};

/** Toggle immutable + aturan otomatis: C/U/D butuh Read, uncheck Read menghapus C/U/D */
export const togglePermission = (
  perms: RolePermissions,
  moduleId: string,
  action: keyof Permission
): RolePermissions => {
  const current = perms[moduleId] || { read: false, create: false, update: false, delete: false };
  const next: Permission = { ...current, [action]: !current[action] };
  if (action !== "read" && next[action]) next.read = true;
  if (action === "read" && !next.read) {
    next.create = false;
    next.update = false;
    next.delete = false;
  }
  return { ...perms, [moduleId]: next };
};

export const setAllPermissions = (value: boolean): RolePermissions =>
  MODULES.reduce((acc, mod) => {
    acc[mod.id] = { 
      read: value && mod.actions.includes("read"), 
      create: value && mod.actions.includes("create"), 
      update: value && mod.actions.includes("update"), 
      delete: value && mod.actions.includes("delete") 
    };
    return acc;
  }, {} as RolePermissions);

export const countModuleAccess = (perms: RolePermissions) =>
  MODULES.filter((m) => perms[m.id]?.read).length;

// ---------- Komponen bersama ----------

export const Toast = ({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slide-in">
      <div className={`flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm max-w-sm ${
        type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
      }`}>
        <span className="text-lg mt-0.5">{type === "success" ? "✅" : "❌"}</span>
        <div className="flex-1">
          <p className="font-bold">{type === "success" ? "Berhasil!" : "Gagal!"}</p>
          <p className="text-xs mt-0.5 opacity-80">{message}</p>
        </div>
        <button onClick={onClose} className="text-lg font-bold opacity-50 hover:opacity-100">×</button>
      </div>
    </div>
  );
};

type MatrixProps = {
  permissions: RolePermissions;
  editable: boolean;
  onToggle?: (moduleId: string, action: keyof Permission) => void;
};

export const PermissionMatrix = ({ permissions, editable, onToggle }: MatrixProps) => (
  <div className="overflow-x-auto rounded-xl border border-border/50">
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
        <tr>
          <th className="px-5 py-3.5 font-semibold">Modul Aplikasi</th>
          {ACTIONS.map((a) => (
            <th key={a.key} className="px-4 py-3.5 font-semibold text-center w-32">{a.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {MODULES.map((mod) => (
          <tr key={mod.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
            <td className="px-5 py-3.5 font-medium">{mod.label}</td>
            {ACTIONS.map((a) => {
              const checked = permissions[mod.id]?.[a.key] || false;
              const isAvailable = mod.actions.includes(a.key);
              
              if (!isAvailable) {
                return (
                  <td key={a.key} className="px-4 py-3.5 text-center text-muted-foreground/40 font-bold">
                    -
                  </td>
                );
              }

              return (
                <td key={a.key} className="px-4 py-3.5 text-center">
                  {editable ? (
                    <input
                      id={`perm-${mod.id}-${a.key}`}
                      type="checkbox"
                      className="w-4 h-4 cursor-pointer accent-primary"
                      checked={checked}
                      onChange={() => onToggle?.(mod.id, a.key)}
                    />
                  ) : checked ? (
                    <span className="inline-flex w-6 h-6 rounded-full bg-green-100 text-green-700 items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="inline-flex w-6 h-6 rounded-full bg-muted text-muted-foreground/60 items-center justify-center">
                      <X className="w-3.5 h-3.5" />
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
