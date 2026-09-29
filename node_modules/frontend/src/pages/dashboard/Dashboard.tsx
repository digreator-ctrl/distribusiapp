import { useGetIdentity } from "@refinedev/core";

export const Dashboard = () => {
  const { data: user } = useGetIdentity<{ name: string }>();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
          Dashboard
        </h1>
        <p className="mt-2 text-surface-500">
          Selamat datang di DistribusiApp, {user?.name || 'User'}!
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Produk', value: '—', color: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30' },
          { label: 'Stok Gudang', value: '—', color: 'bg-sage-50 text-sage-600 dark:bg-sage-900/30' },
          { label: 'Konsinyasi Aktif', value: '—', color: 'bg-cream-50 text-cream-600 dark:bg-cream-900/30' },
          { label: 'Retur Pending', value: '—', color: 'bg-coral-50 text-coral-600 dark:bg-coral-900/30' },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-xl border border-surface-200 bg-white p-6 shadow-card transition-shadow hover:shadow-elevated dark:border-[hsl(216,20%,20%)] dark:bg-[hsl(224,20%,12%)]"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
               <span className="text-lg font-bold">{i + 1}</span>
            </div>
            <p className="text-sm font-medium text-surface-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-surface-900 dark:text-surface-100">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
