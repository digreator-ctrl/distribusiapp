import { useList } from "@refinedev/core";

export const InboundList = () => {
  const { data, isLoading } = useList({
    resource: "inbound_batches",
  });

  const batches = data?.data ?? [];

  return (
    <div className="bg-card p-8 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stok Masuk (Inbound)</h1>
          <p className="text-muted-foreground mt-1">Pencatatan batch produk masuk dari internal atau rekanan.</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:opacity-90 transition">
          + Catat Stok Masuk
        </button>
      </div>
      
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse">Memuat data dari API Hono...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">ID Batch</th>
                <th className="px-6 py-4 font-semibold">Produk</th>
                <th className="px-6 py-4 font-semibold">Sumber</th>
                <th className="px-6 py-4 font-semibold text-right">Jumlah</th>
                <th className="px-6 py-4 font-semibold">Tgl Produksi</th>
                <th className="px-6 py-4 font-semibold text-destructive">Kedaluwarsa</th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada riwayat stok masuk.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{batch.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 font-semibold">{batch.product_name || batch.product_id}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${batch.source_type === 'internal' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {batch.source_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{batch.quantity}</td>
                    <td className="px-6 py-4">{new Date(batch.production_date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 text-destructive font-medium">{new Date(batch.expired_date).toLocaleDateString('id-ID')}</td>
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
