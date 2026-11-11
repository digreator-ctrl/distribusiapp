import { formatDate } from "../../utils/date";
import { useState, useEffect } from "react";

import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, X } from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { cache } from "../../utils/cache";

const Toast = ({ message, onClose }: { message: string; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-50 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3 shadow-xl max-w-sm w-full">
      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-green-800">Berhasil</h3>
        <p className="text-sm text-green-700 mt-1">{message}</p>
      </div>
      <button type="button" onClick={onClose} className="text-green-500 hover:text-green-700 transition">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export const UserList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || "");

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const cachedUsers = cache.get<any[]>("users_list");
  const [users, setUsers] = useState<any[]>(() => cachedUsers || []);
  const [isLoading, setIsLoading] = useState(!cachedUsers);

  const fetchUsers = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : [];
        setUsers(data);
        cache.set("users_list", data);
      }
    } catch (err) {
      console.error(err);
      if (!cachedUsers) setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(Boolean(cachedUsers));
  }, []);

  return (
    <>
      {successMsg && <Toast message={successMsg} onClose={() => setSuccessMsg("")} />}
      <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Kelola data karyawan (Admin & Sales) untuk sistem ini.</p>
          </div>
          <button 
            onClick={() => navigate("/users/create")}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-xs hover:opacity-90 transition text-center shrink-0 text-sm"
          >
            + Tambah Pengguna
          </button>
        </div>
      
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse">Memuat data dari API Hono...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Karyawan</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Terdaftar Pada</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada data pengguna.
                  </td>
                </tr>
              ) : (
                users.map((user: any) => (
                  <tr 
                    key={user.id} 
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-semibold">
                      {user.full_name || user.username}
                      {user.full_name && <div className="text-xs text-muted-foreground font-normal">@{user.username}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'owner' ? 'bg-amber-100 text-amber-800' :
                        user.role === 'admin' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatDate(user.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </>
  );
};
