import { useLogin } from "@refinedev/core";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Link } from "react-router-dom";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: login, isLoading } = useLogin();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    login(
      { email, password },
      {
        onSuccess: (result) => {
          if (!result.success) {
            setErrorMessage(
              (result.error as { message?: string } | undefined)?.message ??
                "Email atau password salah.",
            );
          }
        },
        onError: (error) => {
          setErrorMessage(
            (error as Error)?.message || "Tidak dapat terhubung ke server.",
          );
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-sage-50 p-4 dark:from-[hsl(224,20%,10%)] dark:via-[hsl(224,20%,12%)] dark:to-[hsl(224,20%,8%)]">
      <Card className="w-full max-w-md animate-scale-in border-0 shadow-elevated bg-white/80 backdrop-blur-md dark:bg-[hsl(224,20%,12%)]/80">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-300">D</span>
          </div>
          <CardTitle className="text-2xl">Selamat Datang Kembali</CardTitle>
          <CardDescription>
            Masukkan email dan password untuk masuk ke akun Anda
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {errorMessage && (
              <div
                role="alert"
                className="w-full rounded-md border border-coral-200 bg-coral-50 px-3 py-2 text-sm text-coral-700 dark:border-coral-800 dark:bg-coral-900/30 dark:text-coral-200"
              >
                {errorMessage}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
            <div className="text-center text-sm text-surface-500">
              Belum punya akun?{" "}
              <Link to="/register" className="text-primary-600 hover:underline dark:text-primary-400">
                Daftar sekarang
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
