import { useCreate, useLogout } from "@refinedev/core";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { useNavigate } from "react-router-dom";

export const Onboarding = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  
  const { mutate: createBusiness, isLoading } = useCreate();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBusiness(
      {
        resource: "businesses",
        values: {
          name,
          phone,
          city,
          address,
        },
      },
      {
        onSuccess: (data) => {
          // Save business to local storage to set tenant context
          const businessData = data.data;
          localStorage.setItem('businessId', businessData.id);
          localStorage.setItem('business', JSON.stringify(businessData));
          localStorage.setItem('role', 'role-owner');
          
          navigate("/");
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-white to-sage-50 p-4 dark:from-[hsl(224,20%,10%)] dark:via-[hsl(224,20%,12%)] dark:to-[hsl(224,20%,8%)]">
      <Card className="w-full max-w-lg animate-scale-in border-0 shadow-elevated bg-white/90 backdrop-blur-md dark:bg-[hsl(224,20%,12%)]/90">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Selamat Datang!</CardTitle>
          <CardDescription>
            Mari siapkan profil usaha Anda untuk memulai menggunakan sistem.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Usaha / Toko <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                type="text"
                placeholder="Toko Maju Bersama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon Usaha</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Kota</Label>
              <Input
                id="city"
                type="text"
                placeholder="Jakarta Pusat"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Input
                id="address"
                type="text"
                placeholder="Jl. Merdeka No. 123..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Menyiapkan Usaha..." : "Mulai Gunakan Sistem"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => logout()} className="w-full text-surface-500">
              Keluar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
