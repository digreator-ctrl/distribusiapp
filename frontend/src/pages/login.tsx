import React, { useState } from "react";
import {
  Warehouse,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Building2,
  Phone,
  AtSign,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { authProvider } from "@/providers/authProvider";

export const LoginPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");

  // Form Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Form Register state
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      setErrorMessage("Silakan masukkan nama usaha atau brand Anda.");
      return;
    }
    if (!fullName.trim()) {
      setErrorMessage("Silakan masukkan nama lengkap pemilik usaha.");
      return;
    }
    if (!regUsername.trim()) {
      setErrorMessage("Silakan masukkan username untuk akun Anda.");
      return;
    }
    if (!regPassword || regPassword.length < 5) {
      setErrorMessage("Password minimal harus 5 karakter.");
      return;
    }
    if (regPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      if (!authProvider.register) {
        setErrorMessage("Metode pendaftaran belum tersedia.");
        return;
      }

      const result = await authProvider.register({
        company_name: companyName.trim(),
        full_name: fullName.trim(),
        username: regUsername.trim(),
        phone: phone.trim(),
        password: regPassword.trim(),
      });

      if (result.success && result.redirectTo) {
        setSuccessMessage("Akun Owner berhasil dibuat! Mengalihkan ke dashboard...");
        setTimeout(() => {
          window.location.href = result.redirectTo!;
        }, 800);
      } else if (result.error) {
        setErrorMessage(result.error.message || "Pendaftaran gagal.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menghubungi server.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-card text-card-foreground p-7 sm:p-9 rounded-3xl shadow-xl border border-border/80">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-3.5 ring-1 ring-primary/20">
              <Warehouse className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Distribusi<span className="text-primary">App</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
              {mode === "login"
                ? "SaaS Multi-tenant Distribusi & Konsinyasi"
                : "Pendaftaran Usaha Baru (Owner)"}
            </p>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-2.5 text-destructive animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* MODE: LOGIN */}
          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

              <div className="mt-6 pt-5 border-t border-border/60 text-center">
                <p className="text-xs text-muted-foreground">
                  Belum memiliki akun usaha?{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode("register")}
                    className="text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Daftar sebagai Owner</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* MODE: REGISTER (SaaS Owner) */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Pendaftaran Usaha Baru:</strong> Anda otomatis didaftarkan sebagai <strong>Owner (Pemilik)</strong> dengan hak akses penuh mengelola produk, gudang, staf admin, dan sales.
                </span>
              </div>

              {/* Nama Usaha */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block">
                  Nama Usaha / Perusahaan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="cth. CV Berkah Snack Nusantara"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Nama Lengkap Pemilik */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block">
                  Nama Lengkap Pemilik (Owner)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="cth. Budi Hartono"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Grid: Username & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground block">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <AtSign className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="budi_owner"
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground block">
                    Nomor WhatsApp / HP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08123456789"
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Grid: Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground block">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min. 5 karakter"
                      disabled={isLoading}
                      className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground block">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password"
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-emerald-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mendaftarkan Usaha...</span>
                    </>
                  ) : (
                    <span>Daftar & Masuk sebagai Owner</span>
                  )}
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-border/60 text-center">
                <p className="text-xs text-muted-foreground">
                  Sudah memiliki akun?{" "}
                  <button
                    type="button"
                    onClick={() => toggleMode("login")}
                    className="text-primary font-bold hover:underline cursor-pointer"
                  >
                    Masuk ke akun Anda
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6 font-medium">
          © {new Date().getFullYear()} DistribusiApp — Sistem Manajemen Distribusi
        </p>
      </div>
    </div>
  );
};
