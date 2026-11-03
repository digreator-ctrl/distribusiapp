import React, { useState } from "react";
import { Warehouse, User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { authProvider } from "@/providers/authProvider";

export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage("Silakan masukkan username dan password Anda.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const result = await authProvider.login({
        username: username.trim(),
        password: password.trim(),
      });

      if (result.success && result.redirectTo) {
        window.location.href = result.redirectTo;
      } else if (result.error) {
        setErrorMessage(result.error.message || "Username atau password salah.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menghubungi server backend.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-card text-card-foreground p-8 sm:p-10 rounded-3xl shadow-xl border border-border/80">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="inline-flex p-3.5 bg-primary/10 rounded-2xl text-primary mb-4 ring-1 ring-primary/20">
              <Warehouse className="w-9 h-9" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Distribusi<span className="text-primary">App</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 font-medium">
              Sistem Manajemen Distribusi & Konsinyasi
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Username / No. Handphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau nomor HP"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-md hover:bg-primary/95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Masuk ke Sistem</span>
                )}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-border/60 text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Gunakan akun resmi yang telah didaftarkan oleh Administrator untuk mengakses sistem.
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6 font-medium">
          © {new Date().getFullYear()} DistribusiApp — Sistem Manajemen Distribusi
        </p>
      </div>
    </div>
  );
};
