import { useList } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, UserCog, User, ShieldCheck } from "lucide-react";

export const UserList = () => {
  const { data, isLoading } = useList({
    resource: "businesses/current/members", // This will need a custom dataProvider method or endpoint adjustment later, using a placeholder for now
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
            Manajemen Pengguna
          </h1>
          <p className="mt-1 text-surface-500">
            Kelola akses Owner, Admin, dan Sales
          </p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            Tabel ini adalah placeholder yang akan dihubungkan ke endpoint User Management (Task 2.11)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-surface-200 dark:border-surface-800">
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
               {/* Dummy Data for Display */}
               <div className="flex items-center gap-4 rounded-lg border border-surface-100 p-4 dark:border-surface-800">
                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30">
                   <ShieldCheck className="h-6 w-6" />
                 </div>
                 <div>
                   <p className="font-semibold text-surface-900 dark:text-surface-100">Budi (Owner)</p>
                   <p className="text-sm text-surface-500">budi@example.com</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-4 rounded-lg border border-surface-100 p-4 dark:border-surface-800">
                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-sage-600 dark:bg-sage-900/30">
                   <UserCog className="h-6 w-6" />
                 </div>
                 <div>
                   <p className="font-semibold text-surface-900 dark:text-surface-100">Siti (Admin)</p>
                   <p className="text-sm text-surface-500">siti@example.com</p>
                 </div>
               </div>

               <div className="flex items-center gap-4 rounded-lg border border-surface-100 p-4 dark:border-surface-800">
                 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-100 text-coral-600 dark:bg-coral-900/30">
                   <User className="h-6 w-6" />
                 </div>
                 <div>
                   <p className="font-semibold text-surface-900 dark:text-surface-100">Agus (Sales)</p>
                   <p className="text-sm text-surface-500">agus@example.com</p>
                 </div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
