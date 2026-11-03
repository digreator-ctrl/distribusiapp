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
  const [loginErrors, setLoginErrors] = useState<{
    username?: boolean;
    password?: boolean;
  }>({});

  // Form Register state
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [regErrors, setRegErrors] = useState<{
    companyName?: boolean;
    fullName?: boolean;
    regUsername?: boolean;
    phone?: boolean;
    regPassword?: boolean;
    confirmPassword?: boolean;
  }>({});

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { username?: boolean; password?: boolean } = {};
    if (!username.trim()) errors.username = true;
    if (!password.trim()) errors.password = true;

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
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

    const errors: {
      companyName?: boolean;
      fullName?: boolean;
      regUsername?: boolean;
      phone?: boolean;
      regPassword?: boolean;
      confirmPassword?: boolean;
    } = {};

    if (!companyName.trim()) errors.companyName = true;
    if (!fullName.trim()) errors.fullName = true;
    if (!regUsername.trim()) errors.regUsername = true;
    if (!phone.trim()) errors.phone = true;
    if (!regPassword.trim()) errors.regPassword = true;
    if (!confirmPassword.trim()) errors.confirmPassword = true;

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }

    if (regPassword.length < 5) {
      setErrorMessage("Password minimal harus 5 karakter.");
      setRegErrors((prev) => ({ ...prev, regPassword: true }));
      return;
    }

    if (regPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi password tidak cocok dengan password.");
      setRegErrors((prev) => ({ ...prev, confirmPassword: true }));
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
    setLoginErrors({});
    setRegErrors({});
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

          {/* ========================================= */}
          {/* MODE: LOGIN */}
          {/* ========================================= */}
          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Username / No. Handphone
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                      loginErrors.username ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onFocus={() => {
                      setLoginErrors((prev) => ({ ...prev, username: false }));
                      setErrorMessage("");
                    }}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (loginErrors.username) {
                        setLoginErrors((prev) => ({ ...prev, username: false }));
                      }
                    }}
                    placeholder={
                      loginErrors.username ? "Kolom ini wajib diisi!" : "Masukkan username atau nomor HP"
                    }
                    disabled={isLoading}
                    className={`w-full pl-10 pr-28 py-2.5 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 ${
                      loginErrors.username
                        ? "bg-red-50/40 dark:bg-red-950/20 border-2 border-red-500 text-red-900 dark:text-red-200 placeholder:text-red-500 placeholder:font-semibold focus:ring-2 focus:ring-red-400"
                        : "bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary focus:border-transparent"
                    }`}
                  />
                  {loginErrors.username && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-[11px] font-bold text-red-600 bg-red-100 dark:bg-red-900/60 px-2 py-0.5 rounded-md flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
                        Wajib diisi
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Password
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                      loginErrors.password ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onFocus={() => {
                      setLoginErrors((prev) => ({ ...prev, password: false }));
                      setErrorMessage("");
                    }}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginErrors.password) {
                        setLoginErrors((prev) => ({ ...prev, password: false }));
                      }
                    }}
                    placeholder={
                      loginErrors.password ? "Password wajib diisi!" : "Masukkan password Anda"
                    }
                    disabled={isLoading}
                    className={`w-full pl-10 ${loginErrors.password ? "pr-32" : "pr-10"} py-2.5 rounded-xl text-sm font-medium outline-none transition-all disabled:opacity-50 ${
                      loginErrors.password
                        ? "bg-red-50/40 dark:bg-red-950/20 border-2 border-red-500 text-red-900 dark:text-red-200 placeholder:text-red-500 placeholder:font-semibold focus:ring-2 focus:ring-red-400"
                        : "bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary focus:border-transparent"
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                    {loginErrors.password && (
                      <span className="text-[11px] font-bold text-red-600 bg-red-100 dark:bg-red-900/60 px-2 py-0.5 rounded-md flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
                        Wajib diisi
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
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

              {/* Bottom Toggle Link */}
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
            /* ========================================= */
            /* MODE: REGISTER (SaaS Owner - Berjajar Kebawah) */
            /* ========================================= */
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-3.5">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Pendaftaran Usaha Baru:</strong> Anda otomatis didaftarkan sebagai{" "}
                  <strong>Owner (Pemilik)</strong> dengan hak akses penuh mengelola produk, gudang, staf admin, dan sales.
                </span>
              </div>

              {/* 1. Nama Usaha / Perusahaan */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block">
                  Nama Usaha / Perusahaan
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                      regErrors.companyName ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={companyName}
                    onFocus={() => {
                      setRegErrors((prev) => ({ ...prev, companyName: false }));
                      setErrorMessage("");
                    }}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (regErrors.companyName) {
                        setRegErrors((prev) => ({ ...prev, companyName: false }));
                      }
                    }}
                    placeholder={
                      regErrors.companyName ? "Nama usaha wajib diisi!" : "cth. CV Berkah Snack Nusantara"
                    }
                    disabled={isLoading}
                    className={`w-full pl-9 ${regErrors.companyName ? "pr-24" : "pr-3"} py-2 rounded-xl text-xs font-medium outline-none transition-all disabled:opacity-50 ${
                      regErrors.companyName
                        ? "bg-red-50/40 border-2 border-red-500 text-red-900 placeholder:text-red-500 placeholder:font-semibold focus:ring-2 focus:ring-red-400"
                        : "bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    }`}
                  />
                  {regErrors.companyName && (
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                        Wajib diisi
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Nama Lengkap Pemilik */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block">
                  Nama Lengkap Pemilik (Owner)
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                      regErrors.fullName ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onFocus={() => {
                      setRegErrors((prev) => ({ ...prev, fullName: false }));
                      setErrorMessage("");
                    }}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (regErrors.fullName) {
                        setRegErrors((prev) => ({ ...prev, fullName: false }));
                      }
                    }}
                    placeholder={
                      regErrors.fullName ? "Nama lengkap wajib diisi!" : "cth. Budi Hartono"
                    }
                    disabled={isLoading}
                    className={`w-full pl-9 ${regErrors.fullName ? "pr-24" : "pr-3"} py-2 rounded-xl text-xs font-medium outline-none transition-all disabled:opacity-50 ${
                      regErrors.fullName
                        ? "bg-red-50/40 border-2 border-red-500 text-red-900 placeholder:text-red-500 placeholder:font-semibold focus:ring-2 focus:ring-red-400"
                        : "bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    }`}
                  />
                  {regErrors.fullName && (
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                        Wajib diisi
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Username Pemilik (Berjajar ke bawah) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block">
                  Username Akun
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                      regErrors.regUsername ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    <AtSign className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={regUsername}
                    onFocus={() => {
                      setRegErrors((prev) => ({ ...prev, regUsername: false }));
                      setErrorMessage("");
                    }}
                    onChange={(e) => {
                      setRegUsername(e.target.value);
                      if (regErrors.regUsername) {
                        setRegErrors((prev) => ({ ...prev, regUsername: false }));
                      }
                    }}
                    placeholder={
                      regErrors.regUsername ? "Username wajib diisi!" : "cth. budi_owner"
                    }
                    disabled={isLoading}
                    className={`w-full pl-9 ${regErrors.regUsername ? "pr-24" : "pr-3"} py-2 rounded-xl text-xs font-medium outline-none transition-all disabled:opacity-50 ${
                      regErrors.regUsername
                        ? "bg-red-50/40 border-2 border-red-500 text-red-900 placeholder:text-red-500 placeholder:font-semibold focus:ring-2 focus:ring-red-400"
                        : "bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    }`}
                  />
                  {regErrors.regUsername && (
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                        Wajib diisi
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Nomor WhatsApp / HP (HANYA ANGKA & Berjajar ke bawah) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block">
                  Nomor WhatsApp / HP (Hanya Angka)
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                      regErrors.phone ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={phone}
                    onFocus={() => {
                      setRegErrors((prev) => ({ ...prev, phone: false }));
                      setErrorMessage("");
                    }}
                    onChange={(e) => {
                      // Filter ketat: hanya izinkan karakter digit angka (0-9)
                      const numericOnly = e.target.value.replace(/\D/g, "");
                      setPhone(numericOnly);
                      if (regErrors.phone) {
                        setRegErrors((prev) => ({ ...prev, phone: false }));
                      }
                    }}
                    placeholder={
                      regErrors.phone ? "Nomor HP wajib diisi!" : "cth. 081234567890"
                    }
                    disabled={isLoading}
                    className={`w-full pl-9 ${regErrors.phone ? "pr-24" : "pr-3"} py-2 rounded-xl text-xs font-medium outline-none transition-all disabled:opacity-50 ${
                      regErrors.phone
                        ? "bg-red-50/40 border-2 border-red-500 text-red-900 placeholder:text-red-500 placeholder:font-semibold focus:ring-2 focus:ring-red-400"
                        : "bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    }`}
                  />
                  {regErrors.phone && (
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                        Wajib diisi
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Password (Berjajar ke bawah) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block">
                  Password
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                      regErrors.regPassword ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={regPassword}
                    onFocus={() => {
                      setRegErrors((prev) => ({ ...prev, regPassword: false }));
                      setErrorMessage("");
                    }}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (regErrors.regPassword) {
                        setRegErrors((prev) => ({ ...prev, regPassword: false }));
                      }
                    }}
                    placeholder={
                      regErrors.regPassword ? "Password wajib diisi!" : "Minimal 5 karakter"
                    }
                    disabled={isLoading}
                    className={`w-full pl-9 ${regErrors.regPassword ? "pr-28" : "pr-8"} py-2 rounded-xl text-xs font-medium outline-none transition-all disabled:opacity-50 ${
                      regErrors.regPassword
                        ? "bg-red-50/40 border-2 border-red-500 text-red-900 placeholder:text-red-500 placeholder:font-semibold focus:ring-2 focus:ring-red-400"
                        : "bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5">
                    {regErrors.regPassword && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                        Wajib diisi
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Konfirmasi Password (Berjajar ke bawah) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                      regErrors.confirmPassword ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onFocus={() => {
                      setRegErrors((prev) => ({ ...prev, confirmPassword: false }));
                      setErrorMessage("");
                    }}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (regErrors.confirmPassword) {
                        setRegErrors((prev) => ({ ...prev, confirmPassword: false }));
                      }
                    }}
                    placeholder={
                      regErrors.confirmPassword ? "Konfirmasi password wajib diisi!" : "Ulangi password di atas"
                    }
                    disabled={isLoading}
                    className={`w-full pl-9 ${regErrors.confirmPassword ? "pr-24" : "pr-3"} py-2 rounded-xl text-xs font-medium outline-none transition-all disabled:opacity-50 ${
                      regErrors.confirmPassword
                        ? "bg-red-50/40 border-2 border-red-500 text-red-900 placeholder:text-red-500 placeholder:font-semibold focus:ring-2 focus:ring-red-400"
                        : "bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    }`}
                  />
                  {regErrors.confirmPassword && (
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                        Wajib diisi
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
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

              {/* Bottom Toggle Link */}
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
