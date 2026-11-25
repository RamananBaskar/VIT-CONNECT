const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('vit_connect_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // Events
  getEvents: () => request('/events'),
  createEvent: (payload) =>
    request('/events', { method: 'POST', body: JSON.stringify(payload) }),
  deleteEvent: (id) =>
    request(`/events/${id}`, { method: 'DELETE' }),

  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),

  // Admin
  getUsers: () => request('/admin/users'),
  approveUser: (id, isApproved) =>
    request(`/admin/approve/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isApproved }),
    }),
};
