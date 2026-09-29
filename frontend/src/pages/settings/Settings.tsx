import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Building2, Save, Bell, Shield, Lock } from "lucide-react";

export const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Pengaturan</h1>
        <p className="text-sm text-surface-500">Konfigurasi preferensi aplikasi dan profil bisnis Anda.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-1">
          <button 
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'profile' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800'}`}
            onClick={() => setActiveTab('profile')}
          >
            <Building2 className="h-5 w-5" /> Profil Usaha
          </button>
          <button 
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'notifications' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800'}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className="h-5 w-5" /> Notifikasi
          </button>
          <button 
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-3 ${activeTab === 'security' ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : 'text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-surface-800'}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield className="h-5 w-5" /> Keamanan & Akses
          </button>
        </div>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
              <div className="p-6 border-b border-surface-200 dark:border-surface-800">
                <h2 className="text-lg font-semibold">Informasi Bisnis</h2>
                <p className="text-sm text-surface-500">Perbarui identitas usaha Anda di sistem Navv.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nama Usaha/Toko</label>
                    <Input defaultValue="Roti Kita Bakery" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nomor Telepon</label>
                    <Input defaultValue="08123456789" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Alamat Pusat</label>
                    <Input defaultValue="Jl. Merdeka No. 123, Jakarta" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pajak (PPN) %</label>
                    <Input type="number" defaultValue="11" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mata Uang</label>
                    <Input defaultValue="IDR (Rp)" disabled />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                    <Save className="h-4 w-4 mr-2" /> Simpan Perubahan
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
              <div className="p-6 border-b border-surface-200 dark:border-surface-800">
                <h2 className="text-lg font-semibold">Preferensi Notifikasi</h2>
                <p className="text-sm text-surface-500">Atur pemberitahuan untuk aktivitas penting.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-surface-200 dark:border-surface-800 rounded-lg">
                    <div>
                      <h4 className="font-medium">Stok Hampir Habis</h4>
                      <p className="text-sm text-surface-500">Terima notifikasi saat stok produk mencapai batas minimum.</p>
                    </div>
                    <input type="checkbox" className="h-5 w-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border border-surface-200 dark:border-surface-800 rounded-lg">
                    <div>
                      <h4 className="font-medium">Barang Kedaluwarsa</h4>
                      <p className="text-sm text-surface-500">Notifikasi 30 hari sebelum batch produk expired.</p>
                    </div>
                    <input type="checkbox" className="h-5 w-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-surface-200 dark:border-surface-800 rounded-lg">
                    <div>
                      <h4 className="font-medium">Pengajuan Retur Baru</h4>
                      <p className="text-sm text-surface-500">Peringatan saat agen/sales mengajukan retur.</p>
                    </div>
                    <input type="checkbox" className="h-5 w-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500" defaultChecked />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                    <Save className="h-4 w-4 mr-2" /> Simpan
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white dark:bg-[hsl(224,20%,10%)] rounded-xl border border-surface-200 dark:border-surface-800 overflow-hidden">
              <div className="p-6 border-b border-surface-200 dark:border-surface-800">
                <h2 className="text-lg font-semibold">Ubah Kata Sandi</h2>
                <p className="text-sm text-surface-500">Perbarui kata sandi untuk menjaga keamanan akun Anda.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kata Sandi Saat Ini</label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kata Sandi Baru</label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Konfirmasi Kata Sandi Baru</label>
                  <Input type="password" />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                    <Lock className="h-4 w-4 mr-2" /> Perbarui Sandi
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
