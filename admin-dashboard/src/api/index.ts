export const BASE_URL = 'http://127.0.0.1:5000';
export const API_URL = `${BASE_URL}/api`;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// --- Category & Subcategory APIs ---
export const fetchCategories = async () => {
  const response = await fetch(`${API_URL}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
};

export const fetchSubcategories = async (categoryId: string) => {
  const response = await fetch(`${API_URL}/categories/${categoryId}/subcategories`);
  if (!response.ok) throw new Error('Failed to fetch subcategories');
  return response.json();
};

export const createCategory = async (formData: FormData) => {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create category');
  }
  return response.json();
};

export const updateCategory = async (id: string, formData: FormData) => {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update category');
  }
  return response.json();
};

export const deleteCategory = async (id: string) => {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete category');
  return response.json();
};

export const createSubcategory = async (formData: FormData) => {
  const response = await fetch(`${API_URL}/subcategories`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create subcategory');
  }
  return response.json();
};

export const updateSubcategory = async (id: string, formData: FormData) => {
  const response = await fetch(`${API_URL}/subcategories/${id}`, {
    method: 'PUT',
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update subcategory');
  }
  return response.json();
};

export const deleteSubcategory = async (id: string) => {
  const response = await fetch(`${API_URL}/subcategories/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete subcategory');
  return response.json();
};

// --- User APIs ---
export const fetchUsers = async (role?: string, status?: string) => {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (status) params.append('status', status);
  
  const response = await fetch(`${API_URL}/users?${params.toString()}`, {
      headers: getAuthHeaders()
  });
  
  if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response.json();
};

// --- Customers APIs ---
export const fetchCustomers = async () => {
  const response = await fetch(`${API_URL}/customers`, {
    headers: getAuthHeaders()
  });
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
    throw new Error('Session expired. Please login again.');
  }
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText} - ${text}`);
  }
  return response.json();
};

export const fetchCustomerById = async (id: string) => {
  const response = await fetch(`${API_URL}/customers/${id}`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch customer details');
  return response.json();
};

export const fetchUserById = async (id: string) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch user details');
    return response.json();
};

export const updateUserStatus = async (id: string, status: 'approved' | 'rejected', rating?: number, rejectionReason?: string) => {
  const response = await fetch(`${API_URL}/users/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status, rating, rejectionReason }),
  });
  if (!response.ok) throw new Error('Failed to update user status');
  return response.json();
};

// --- Booking APIs ---
export const fetchBookings = async () => {
  const response = await fetch(`${API_URL}/bookings`);
  if (!response.ok) throw new Error('Failed to fetch bookings');
  return response.json();
};

export const updateBookingStatus = async (id: string, status: string) => {
  const response = await fetch(`${API_URL}/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update booking status');
  return response.json();
};

// --- Dashboard APIs ---
export const fetchDashboardStats = async () => {
  const response = await fetch(`${API_URL}/dashboard`, {
      headers: getAuthHeaders()
  });

  if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
};
