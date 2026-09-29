import { useShow, useCustomMutation } from "@refinedev/core";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState, useEffect } from "react";

export const AgentShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { queryResult } = useShow({
    resource: "agents",
    id,
  });

  const { mutate, isLoading: isUpdating } = useCustomMutation();

  const agent = queryResult.data?.data;
  
  const [rule, setRule] = useState({
    minimum_order: 0,
    price_type: "agent",
    return_policy: ""
  });

  useEffect(() => {
    if (agent?.rule) {
      setRule({
        minimum_order: agent.rule.minimum_order || 0,
        price_type: agent.rule.price_type || "agent",
        return_policy: agent.rule.return_policy || ""
      });
    }
  }, [agent]);

  const handleUpdateRule = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      url: `/api/agents/${id}/rules`,
      method: "post",
      values: rule,
    }, {
      onSuccess: () => {
        queryResult.refetch();
        alert("Ketentuan berhasil diperbarui!");
      }
    });
  };

  if (queryResult.isLoading) return <div className="p-4">Memuat data...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/agents")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">{agent?.name}</h1>
          <p className="text-sm text-surface-500">Kode: {agent?.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
          <h2 className="text-lg font-semibold border-b border-surface-200 dark:border-surface-800 pb-2">Informasi Agen</h2>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 text-surface-500">
              <span>Kontak</span>
              <span className="col-span-2 text-surface-900 dark:text-surface-100 font-medium">{agent?.contact_person || "-"}</span>
            </div>
            <div className="grid grid-cols-3 text-surface-500">
              <span>Telepon</span>
              <span className="col-span-2 text-surface-900 dark:text-surface-100 font-medium">{agent?.phone || "-"}</span>
            </div>
            <div className="grid grid-cols-3 text-surface-500">
              <span>Email</span>
              <span className="col-span-2 text-surface-900 dark:text-surface-100 font-medium">{agent?.email || "-"}</span>
            </div>
            <div className="grid grid-cols-3 text-surface-500">
              <span>Alamat</span>
              <span className="col-span-2 text-surface-900 dark:text-surface-100 font-medium">{agent?.address || "-"}, {agent?.city || ""}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[hsl(224,20%,10%)] p-6 rounded-xl border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-surface-200 dark:border-surface-800 pb-2">
            <ShieldAlert className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold">Ketentuan Agen (Rules)</h2>
          </div>
          
          <form onSubmit={handleUpdateRule} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Order Quantity (MOQ)</label>
              <Input 
                type="number" 
                min="0"
                value={rule.minimum_order} 
                onChange={(e) => setRule({...rule, minimum_order: Number(e.target.value)})} 
              />
              <p className="text-xs text-surface-500">Jumlah minimal item per pesanan.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Harga</label>
              <select
                value={rule.price_type}
                onChange={(e) => setRule({...rule, price_type: e.target.value})}
                className="flex h-10 w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-surface-800 dark:bg-[hsl(224,20%,8%)] dark:ring-offset-[hsl(224,20%,8%)] dark:placeholder:text-surface-400 dark:focus-visible:ring-primary-500"
              >
                <option value="agent">Harga Agen Default</option>
                <option value="custom">Harga Custom</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kebijakan Retur</label>
              <Input 
                placeholder="Contoh: Boleh retur maksimal 14 hari..."
                value={rule.return_policy} 
                onChange={(e) => setRule({...rule, return_policy: e.target.value})} 
              />
            </div>

            <div className="pt-2 text-right">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan Ketentuan</>}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
