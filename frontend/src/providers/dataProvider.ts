import type { DataProvider } from '@refinedev/core';

const API_URL = '/api';

// Get stored auth token
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Get stored business ID
const getBusinessId = (): string | null => {
  return localStorage.getItem('businessId');
};

// Build headers with auth and tenant context
const buildHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const businessId = getBusinessId();
  if (businessId) {
    headers['X-Business-Id'] = businessId;
  }

  return headers;
};

// Handle API response
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    const params = new URLSearchParams();

    if (pagination) {
      params.set('page', String(pagination.current || 1));
      params.set('limit', String(pagination.pageSize || 20));
    }

    if (sorters && sorters.length > 0) {
      params.set('sortBy', sorters[0].field);
      params.set('sortOrder', sorters[0].order);
    }

    if (filters) {
      filters.forEach((filter) => {
        if ('field' in filter && filter.value !== undefined) {
          params.set(filter.field, String(filter.value));
        }
      });
    }

    const response = await fetch(`${API_URL}/${resource}?${params.toString()}`, {
      headers: buildHeaders(),
    });

    const result = await handleResponse(response);

    return {
      data: result.data || [],
      total: result.meta?.total || 0,
    };
  },

  getOne: async ({ resource, id }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      headers: buildHeaders(),
    });

    const result = await handleResponse(response);

    return {
      data: result.data,
    };
  },

  create: async ({ resource, variables }) => {
    const response = await fetch(`${API_URL}/${resource}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(variables),
    });

    const result = await handleResponse(response);

    return {
      data: result.data,
    };
  },

  update: async ({ resource, id, variables }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      method: 'PUT',
      headers: buildHeaders(),
      body: JSON.stringify(variables),
    });

    const result = await handleResponse(response);

    return {
      data: result.data,
    };
  },

  deleteOne: async ({ resource, id }) => {
    const response = await fetch(`${API_URL}/${resource}/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });

    const result = await handleResponse(response);

    return {
      data: result.data,
    };
  },

  getApiUrl: () => API_URL,
};
