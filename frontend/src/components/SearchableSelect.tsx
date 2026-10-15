import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, X, Loader2, AlertCircle, Check } from "lucide-react";

export interface SearchableOption {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  id?: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options: SearchableOption[];
  value: string; // nama yang terpilih atau id
  onSelect: (option: SearchableOption | null) => void;
  disabled?: boolean;
  disabledPlaceholder?: string;
  isLoading?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export const SearchableSelect = ({
  id,
  label,
  required = false,
  placeholder = "Ketik untuk mencari...",
  options,
  value,
  onSelect,
  disabled = false,
  disabledPlaceholder = "Pilih data sebelumnya terlebih dahulu",
  isLoading = false,
  hasError = false,
  errorMessage,
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal search query dengan value saat value berubah dari luar
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery(value || "");
    }
  }, [value, isOpen]);

  // Handle klik di luar untuk menutup dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery(value || "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  // Filter opsi berdasarkan input pencarian pengguna
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery === value) {
      return options;
    }
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => opt.name.toLowerCase().includes(q));
  }, [options, searchQuery, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!isOpen) setIsOpen(true);
    // Jika dikosongkan total oleh user
    if (!val.trim() && value) {
      onSelect(null);
    }
  };

  const handleSelectOption = (opt: SearchableOption) => {
    onSelect(opt);
    setSearchQuery(opt.name);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchQuery("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative space-y-1">
      {/* Label & Loading Status */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className={`font-bold text-[11px] block transition ${
            hasError ? "text-red-600 font-extrabold" : "text-foreground"
          }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {isLoading && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
            <Loader2 size={10} className="animate-spin text-primary" /> Memuat...
          </span>
        )}
      </div>

      {/* Input Box yang bisa diketik langsung */}
      <div className="relative">
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Search size={13} />
        </div>

        <input
          id={id}
          ref={inputRef}
          type="text"
          disabled={disabled || isLoading}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled && !isLoading) setIsOpen(true);
          }}
          placeholder={disabled ? disabledPlaceholder : placeholder}
          autoComplete="off"
          className={`w-full rounded-xl pl-8 pr-14 py-2 text-xs text-foreground transition focus:outline-none disabled:opacity-50 disabled:bg-muted/30 ${
            hasError
              ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200 placeholder:text-red-300"
              : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
          }`}
        />

        {/* Clear & Dropdown Icon */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
              title="Hapus pilihan"
            >
              <X size={12} />
            </button>
          )}
          <button
            type="button"
            disabled={disabled || isLoading}
            onClick={() => {
              if (!disabled && !isLoading) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            className="p-1 text-muted-foreground hover:text-foreground transition disabled:opacity-40"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Hasil Pencarian Float */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-card border border-border shadow-2xl rounded-xl max-h-52 overflow-y-auto text-xs divide-y divide-border/40 animate-in fade-in slide-in-from-top-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.name === value || opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between transition hover:bg-muted/80 ${
                    isSelected ? "bg-primary/10 text-primary font-bold" : "text-foreground font-medium"
                  }`}
                >
                  <span className="truncate">{opt.name}</span>
                  {isSelected && <Check size={14} className="text-primary shrink-0" />}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-3 text-center text-muted-foreground text-[11px]">
              {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Belum ada opsi"}
            </div>
          )}
        </div>
      )}

      {/* Pesan Error */}
      {hasError && errorMessage && (
        <p className="text-[10px] text-red-500 font-semibold mt-0.5 flex items-center gap-1">
          <AlertCircle size={11} className="shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
};
