import { useState, useRef, useEffect, useMemo } from "react";
import { Tag, ChevronDown, X, Plus, Check } from "lucide-react";
import { API_BASE_URL } from "../config/api";

const DEFAULT_SUGGESTIONS = [
  "Toko Kelontong",
  "Minimarket",
  "Warung Sembako",
  "Grosir / Agen",
  "Kios Pasar",
  "Apotek / Toko Obat",
  "Toko Kosmetik",
  "Kafe / Resto",
  "Kantin Sekolah / Kampus"
];

interface CategoryComboboxProps {
  id?: string;
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  errorMessage?: string;
  extraCategories?: string[];
}

export const CategoryCombobox = ({
  id = "field-category",
  label = "Kategori Mitra",
  required = false,
  value,
  onChange,
  placeholder = "Pilih atau ketik kategori...",
  hasError = false,
  errorMessage,
  extraCategories = [],
}: CategoryComboboxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [fetchedCategories, setFetchedCategories] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ambil kategori yang pernah diinput sebelumnya dari API
  useEffect(() => {
    let isMounted = true;
    const fetchExisting = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/store_categories`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && isMounted) {
            setFetchedCategories(list.filter(Boolean));
          }
        }
      } catch (err) {
        // abaikan error koneksi, fallback ke default
      }
    };
    fetchExisting();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync saat value diubah dari luar
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gabungkan kategori dari server + extraCategories + default suggestions (tanpa duplikat)
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    fetchedCategories.forEach((c) => c && set.add(c.trim()));
    extraCategories.forEach((c) => c && set.add(c.trim()));
    DEFAULT_SUGGESTIONS.forEach((c) => set.add(c));
    return Array.from(set);
  }, [fetchedCategories, extraCategories]);

  // Filter daftar opsi berdasarkan apa yang diketik
  const filteredOptions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return allCategories;
    return allCategories.filter((cat) => cat.toLowerCase().includes(q));
  }, [allCategories, inputValue]);

  // Cek apakah teks yang diketik persis sama dengan salah satu opsi
  const isExactMatch = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    return allCategories.some((cat) => cat.toLowerCase() === q);
  }, [allCategories, inputValue]);

  const handleSelect = (category: string) => {
    onChange(category);
    setInputValue(category);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setInputValue("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between mb-1 sm:mb-1.5">
        <label
          htmlFor={id}
          className={`font-bold text-xs sm:text-sm block transition ${
            hasError ? "text-red-600 font-extrabold" : "text-foreground"
          }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {allCategories.length > 0 && (
          <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">
            {fetchedCategories.length > 0
              ? `${fetchedCategories.length} kategori tersimpan`
              : "Saran otomatis"}
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <Tag size={14} />
        </div>

        <input
          id={id}
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full rounded-xl pl-9 pr-14 py-2.5 sm:py-2.5 text-xs sm:text-sm text-foreground transition focus:outline-none ${
            hasError
              ? "bg-red-50/60 border-2 border-red-500 ring-2 ring-red-200 placeholder:text-red-300"
              : "bg-background border border-border focus:ring-2 focus:ring-primary/20"
          }`}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition"
              title="Hapus"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
            className="p-1 text-muted-foreground hover:text-foreground transition"
            title="Tampilkan daftar kategori"
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Menu Otomatis */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-card border border-border shadow-2xl rounded-xl max-h-60 overflow-y-auto text-xs sm:text-sm divide-y divide-border/40 animate-in fade-in slide-in-from-top-1">
          {/* Daftar Kategori Yang Cocok */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((cat) => {
              const isSelected = cat.toLowerCase() === inputValue.trim().toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(cat);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(cat);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition hover:bg-muted/80 cursor-pointer ${
                    isSelected ? "bg-primary/10 text-primary font-bold" : "text-foreground font-medium"
                  }`}
                >
                  <span className="truncate pointer-events-none">{cat}</span>
                  {isSelected && <Check size={14} className="text-primary shrink-0 pointer-events-none" />}
                </button>
              );
            })
          ) : (
            <div className="px-3.5 py-2.5 text-center text-muted-foreground text-xs">
              Belum ada kategori yang cocok dengan &quot;{inputValue}&quot;
            </div>
          )}

          {/* Opsi Tambah Kategori Baru jika belum ada di list */}
          {inputValue.trim() && !isExactMatch && (
            <button
              type="button"
              onClick={() => handleSelect(inputValue.trim())}
              className="w-full text-left px-3.5 py-2.5 text-primary hover:bg-primary/10 transition flex items-center gap-2 font-bold bg-primary/5"
            >
              <Plus size={14} className="shrink-0" />
              <span>Gunakan kategori baru: &quot;{inputValue.trim()}&quot;</span>
            </button>
          )}
        </div>
      )}

      {hasError && errorMessage && (
        <p className="text-[11px] sm:text-xs text-red-500 font-semibold mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

