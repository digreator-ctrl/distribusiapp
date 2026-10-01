import { useList } from "@refinedev/core";

export const UserList = () => {
  const { data, isLoading } = useList({
    resource: "users",
  });

  const users = data?.data ?? [];

  return (
    <div className="bg-card p-8 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
          <p className="text-muted-foreground mt-1">Kelola data karyawan (Admin & Sales) untuk sistem ini.</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:opacity-90 transition">
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
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Username</th>
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
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{user.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 font-semibold">{user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'owner' ? 'bg-amber-100 text-amber-800' :
                        user.role === 'admin' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
