import { useState } from "react";
import { BarChart3, TrendingUp, Package, Users, Store, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const SalesSummary = () => {
  const [period, setPeriod] = useState("Bulan Ini");

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Ringkasan Penjualan</h1>
          <p className="text-surface-500">Pantau performa penjualan dari semua channel.</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="h-10 rounded-lg border border-surface-200 bg-white px-3 text-sm font-medium dark:border-surface-700 dark:bg-surface-800"
          >
            <option>Hari Ini</option>
            <option>Minggu Ini</option>
            <option>Bulan Ini</option>
            <option>Tahun Ini</option>
          </select>
          <Button variant="outline" className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 font-medium mb-1">Total Penjualan</p>
            <h3 className="text-3xl font-bold">Rp 125.4M</h3>
            <p className="text-sm text-blue-200 mt-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> +15% dari bulan lalu
            </p>
          </div>
          <BarChart3 className="absolute -bottom-4 -right-4 h-24 w-24 text-white opacity-20" />
        </div>
        
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-surface-500 font-medium mb-1">Penjualan Sales</p>
            <h3 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Rp 85.2M</h3>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Users className="h-4 w-4" /> 24 Sales Aktif
          </div>
        </div>

        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-surface-500 font-medium mb-1">Penjualan Toko (Konsinyasi)</p>
            <h3 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Rp 28.5M</h3>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm font-medium text-amber-600 dark:text-amber-400">
            <Store className="h-4 w-4" /> 142 Toko Aktif
          </div>
        </div>

        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-surface-500 font-medium mb-1">Penjualan Agen</p>
            <h3 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Rp 11.7M</h3>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <Package className="h-4 w-4" /> 8 Agen Aktif
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Produk Terlaris</h2>
            <Button variant="ghost" size="sm" className="text-primary-600">Lihat Semua</Button>
          </div>
          <div className="space-y-4">
            {[
              { name: "Roti Sisir Mentega", variant: "Original", qty: 2450, val: "Rp 24.5M" },
              { name: "Roti Coklat Lumer", variant: "Coklat", qty: 1820, val: "Rp 18.2M" },
              { name: "Roti Keju Susu", variant: "Keju", qty: 1540, val: "Rp 15.4M" },
              { name: "Donat Gula", variant: "Original", qty: 1200, val: "Rp 6.0M" },
              { name: "Kue Sus", variant: "Vanilla", qty: 950, val: "Rp 4.75M" }
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-surface-900 dark:text-surface-100">{p.name}</h4>
                    <p className="text-xs text-surface-500">Varian: {p.variant}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-surface-900 dark:text-surface-100">{p.qty} pcs</div>
                  <div className="text-xs font-semibold text-green-600 dark:text-green-400">{p.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Channels */}
        <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-2xl border border-surface-200 dark:border-surface-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Performa Sales Terbaik</h2>
            <Button variant="ghost" size="sm" className="text-primary-600">Lihat Semua</Button>
          </div>
          <div className="space-y-4">
            {[
              { name: "Budi Santoso", area: "Jakarta Selatan", val: "Rp 18.2M", visits: 142 },
              { name: "Andi Wijaya", area: "Jakarta Barat", val: "Rp 15.4M", visits: 128 },
              { name: "Citra Lestari", area: "Tangerang", val: "Rp 14.1M", visits: 135 },
              { name: "Dewi Susanti", area: "Depok", val: "Rp 12.8M", visits: 110 },
              { name: "Eko Prasetyo", area: "Bogor", val: "Rp 11.5M", visits: 98 }
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-700 dark:to-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-surface-600 dark:text-surface-300 font-bold text-lg">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-surface-900 dark:text-surface-100">{s.name}</h4>
                    <p className="text-xs text-surface-500">Area: {s.area}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-surface-900 dark:text-surface-100">{s.val}</div>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">{s.visits} Kunjungan</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
