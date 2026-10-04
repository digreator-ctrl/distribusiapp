import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import type { Role } from "./store";
import { MODULES, COLOR_CLASSES, loadRoles, countModuleAccess } from "./store";

export const RbacList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    setRoles(loadRoles());
  }, []);

  return (
    <div className="bg-card p-8 rounded-2xl border shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen RBAC &amp; Hak Akses</h1>
          <p className="text-muted-foreground mt-1">Daftar role pengguna. Klik salah satu role untuk melihat dan mengatur hak aksesnya.</p>
        </div>
        <button
          id="btn-add-role"
          onClick={() => navigate("/rbac/create")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:opacity-90 transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Tambah Role
        </button>
      </div>



      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
            <tr>
              <th className="px-5 py-3.5 font-semibold w-12">No</th>
              <th className="px-5 py-3.5 font-semibold">Nama Role</th>
              <th className="px-5 py-3.5 font-semibold">Deskripsi</th>
              <th className="px-5 py-3.5 font-semibold text-center">Tipe</th>
              <th className="px-5 py-3.5 font-semibold text-center">Akses Modul</th>
              <th className="px-5 py-3.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  Tidak ada role yang ditemukan.
                </td>
              </tr>
            ) : (
              roles.map((role, idx) => (
                <tr
                  key={role.id}
                  onClick={() => navigate(`/rbac/${role.id}`)}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 text-muted-foreground">{idx + 1}</td>
                  <td className="px-5 py-3.5 text-foreground font-medium">
                    {role.name}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{role.description || "-"}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${COLOR_CLASSES[role.color] || COLOR_CLASSES.purple}`}>
                      {role.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {countModuleAccess(role.permissions)} / {MODULES.length}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
