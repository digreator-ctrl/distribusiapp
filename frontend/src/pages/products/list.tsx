import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8787/api";

export const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/products`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(`Gagal memuat data: ${err.message}. Pastikan backend sedang berjalan.`);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="bg-card p-8 rounded-2xl border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Katalog Produk</h1>
          <p className="text-muted-foreground mt-1">Kelola data master produk, varian, dan harga. Klik baris untuk melihat detail.</p>
        </div>
        <button 
          onClick={() => navigate("/products/create")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium shadow hover:opacity-90 transition"
        >
          + Tambah Produk
        </button>
      </div>
      
      {isLoading ? (
        <div className="py-10 text-center text-muted-foreground animate-pulse">Memuat data dari API...</div>
      ) : error ? (
        <div className="py-10 text-center">
          <p className="text-red-500 font-semibold mb-3">{error}</p>
          <button onClick={fetchProducts} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Produk</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Merk</th>
                <th className="px-6 py-4 font-semibold text-center">Varian</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada data produk di database. Silakan tambah produk baru.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr 
                    key={product.id} 
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{product.id?.substring(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{product.category || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium">{product.brand || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-bold">
                        {product.variants?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                        product.is_active == null || product.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {product.is_active == null || product.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
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
