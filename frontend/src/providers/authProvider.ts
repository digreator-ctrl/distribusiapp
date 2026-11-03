import type { AuthProvider } from "@refinedev/core";
import { API_BASE_URL } from "../config/api";

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: {
            name: "Login Error",
            message: data.error || "Username atau password tidak sesuai",
          },
        };
      }

      localStorage.setItem("distribusi_token", data.token);
      localStorage.setItem("distribusi_role", data.user.role);
      localStorage.setItem("distribusi_user_id", data.user.id);
      localStorage.setItem("distribusi_user_name", data.user.full_name || data.user.username);
      localStorage.setItem("distribusi_tenant_id", data.user.tenant_id);
      localStorage.setItem("distribusi_tenant_name", data.user.tenant_name || "");

      const targetUrl = data.user.role === "sales" ? "/sales" : "/";
      return {
        success: true,
        redirectTo: targetUrl,
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          name: "Connection Error",
          message: "Gagal terhubung ke server backend. Periksa koneksi internet Anda.",
        },
      };
    }
  },
  register: async ({ company_name, full_name, username, phone, password }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_name, full_name, username, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: {
            name: "Register Error",
            message: data.error || "Pendaftaran usaha gagal",
          },
        };
      }

      localStorage.setItem("distribusi_token", data.token);
      localStorage.setItem("distribusi_role", data.user.role);
      localStorage.setItem("distribusi_user_id", data.user.id);
      localStorage.setItem("distribusi_user_name", data.user.full_name || data.user.username);
      localStorage.setItem("distribusi_tenant_id", data.user.tenant_id);
      localStorage.setItem("distribusi_tenant_name", data.user.tenant_name || "");

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          name: "Connection Error",
          message: "Gagal terhubung ke server backend. Periksa koneksi internet Anda.",
        },
      };
    }
  },
  logout: async () => {
    localStorage.removeItem("distribusi_token");
    localStorage.removeItem("distribusi_role");
    localStorage.removeItem("distribusi_user_id");
    localStorage.removeItem("distribusi_user_name");
    localStorage.removeItem("distribusi_tenant_id");
    localStorage.removeItem("distribusi_tenant_name");
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    const token = localStorage.getItem("distribusi_token");
    if (token) {
      return {
        authenticated: true,
      };
    }
    return {
      authenticated: false,
      redirectTo: "/login",
      logout: true,
    };
  },
  getPermissions: async () => {
    const role = localStorage.getItem("distribusi_role");
    return role ? role : null;
  },
  getIdentity: async () => {
    const token = localStorage.getItem("distribusi_token");
    const name = localStorage.getItem("distribusi_user_name") || "Pengguna";
    const role = localStorage.getItem("distribusi_role") || "user";
    const id = localStorage.getItem("distribusi_user_id") || "1";
    if (token) {
      return {
        id,
        name,
        role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff`,
      };
    }
    return null;
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
};
