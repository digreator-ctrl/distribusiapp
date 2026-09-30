import { Hammer } from "lucide-react";

export const PlaceholderPage = ({ title, description }: { title: string, description?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
      <div className="h-20 w-20 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-full flex items-center justify-center mb-6">
        <Hammer className="h-10 w-10" />
      </div>
      <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
        {title}
      </h1>
      <p className="text-surface-500 max-w-md mx-auto">
        {description || "Halaman ini sedang dalam tahap pengembangan dan akan segera tersedia. Terima kasih atas kesabaran Anda!"}
      </p>
    </div>
  );
};
