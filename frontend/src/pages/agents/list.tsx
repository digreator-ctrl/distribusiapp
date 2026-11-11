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
    <div className="fixed top-6 right-6 z-50 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3 shadow-xl max-w-sm w-full animate-in fade-in slide-in-from-top-5">
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

export const AgentList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.successMessage || "");

  useEffect(() => {
    if (location.state?.successMessage) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const cachedAgents = cache.get<any[]>("agents_list");
  const [agents, setAgents] = useState<any[]>(() => cachedAgents || []);
  const [isLoading, setIsLoading] = useState(!cachedAgents);

  const fetchAgents = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/agents`);
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : [];
        setAgents(data);
        cache.set("agents_list", data);
      }
    } catch (err) {
      console.error("Gagal memuat agen:", err);
      if (!cachedAgents) setAgents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents(Boolean(cachedAgents));
  }, []);

  return (
    <>
      {successMsg && <Toast message={successMsg} onClose={() => setSuccessMsg("")} />}
      <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Manajemen Agen</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Kelola data agen untuk distribusi.</p>
          </div>
          <button 
            onClick={() => navigate("/agents/create")}
            className="w-full sm:w-auto px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold shadow-xs hover:opacity-90 transition text-center shrink-0 text-sm"
          >
            + Tambah Agen
          </button>
        </div>
        
        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground animate-pulse">Memuat data agen dari API...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nama Agen</th>
                  <th className="px-6 py-4 font-semibold">Kontak</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      Belum ada data agen.
                    </td>
                  </tr>
                ) : (
                  agents.map((agent: any) => (
                    <tr 
                      key={agent.id} 
                      onClick={() => navigate(`/agents/${agent.id}`)}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-semibold text-primary hover:underline">{agent.name}</td>
                      <td className="px-6 py-4">{agent.contact}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          agent.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{agent.notes || '-'}</td>
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
