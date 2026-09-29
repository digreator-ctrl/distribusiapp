import type { AuthProvider } from '@refinedev/core';

const API_URL = '/api';

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        // If user has a business, store it
        if (result.data.business) {
          localStorage.setItem('businessId', result.data.business.id);
          localStorage.setItem('business', JSON.stringify(result.data.business));
        }

        if (result.data.role) {
          localStorage.setItem('role', result.data.role);
        }

        return {
          success: true,
          redirectTo: '/',
        };
      }

      return {
        success: false,
        error: {
          name: 'Login Error',
          message: result.message || 'Email atau password salah.',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'Login Error',
          message: 'Tidak dapat terhubung ke server.',
        },
      };
    }
  },

  register: async ({ name, email, password, phone }) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        return {
          success: true,
          redirectTo: '/onboarding',
        };
      }

      return {
        success: false,
        error: {
          name: 'Register Error',
          message: result.message || 'Registrasi gagal.',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: 'Register Error',
          message: 'Tidak dapat terhubung ke server.',
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('businessId');
    localStorage.removeItem('business');
    localStorage.removeItem('role');

    return {
      success: true,
      redirectTo: '/login',
    };
  },

  check: async () => {
    const token = localStorage.getItem('token');

    if (token) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      redirectTo: '/login',
    };
  },

  getPermissions: async () => {
    const role = localStorage.getItem('role');
    return role || null;
  },

  getIdentity: async () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url,
      };
    }
    return null;
  },

  onError: async (error) => {
    if (error?.statusCode === 401) {
      return {
        logout: true,
        redirectTo: '/login',
      };
    }
    return { error };
  },
};
