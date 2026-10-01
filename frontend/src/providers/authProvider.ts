import type { AuthProvider } from "@refinedev/core";

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    if (username === "admin" && password === "admin") {
      localStorage.setItem("distribusi_token", "dummy_token");
      localStorage.setItem("distribusi_role", "admin");
      return {
        success: true,
        redirectTo: "/",
      };
    }
    return {
      success: false,
      error: {
        name: "Login Error",
        message: "Kredensial tidak valid",
      },
    };
  },
  logout: async () => {
    localStorage.removeItem("distribusi_token");
    localStorage.removeItem("distribusi_role");
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
    if (token) {
      return {
        id: 1,
        name: "Admin Distribusi",
        avatar: "https://i.pravatar.cc/150?u=admin",
      };
    }
    return null;
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
};
